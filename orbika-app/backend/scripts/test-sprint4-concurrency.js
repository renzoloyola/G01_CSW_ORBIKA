// Base efímera, exclusivamente en 127.0.0.1; nunca usa la base Supabase del .env.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { supabaseAdmin } from '../src/config/supabaseClient.js';
import { crearPedido } from '../src/services/pedido.service.js';
const root = fileURLToPath(new URL('..', import.meta.url));
const bin = process.env.ORBIKA_PG_BIN;
if (!bin) throw new Error('Define ORBIKA_PG_BIN con el directorio bin de PostgreSQL local (initdb y pg_ctl).');
const scratch = path.join(root, '.local-test');
await mkdir(scratch, { recursive: true });
const data = await mkdtemp(path.join(scratch, 'sprint4-'));
const port = 65439;
const clients = [];
let started = false;
const seller = '11111111-1111-4111-8111-111111111111';
const buyer = '22222222-2222-4222-8222-222222222222';
const other = '33333333-3333-4333-8333-333333333333';
const key = (n) => `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12,'0')}`;
function command(name, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(path.join(bin, name + (process.platform === 'win32' ? '.exe' : '')), args, { windowsHide: true });
    let out = ''; child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
    child.on('error', reject); child.on('exit', code => code === 0 ? resolve(out) : reject(new Error(out)));
  });
}
async function connect(name) {
  const c = new Client({ host: '127.0.0.1', port, user: 'postgres', database: 'postgres', application_name: name, statement_timeout: 15000 });
  await c.connect(); clients.push(c); return c;
}
const evidence = [];
try {
  await command('initdb', ['-D', data, '-U', 'postgres', '--auth-local=trust', '--auth-host=trust', '--encoding=UTF8', '--no-locale']);
  await command('pg_ctl', ['-D', data, '-l', path.join(data,'server.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);
  started = true;
  const admin = await connect('sprint4-admin');
  await admin.query(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
  for (const migration of ['001_init_schema.sql','002_security_and_order_transactions.sql','003_srs_integrity_and_images.sql','004_discount_precision.sql','005_profile_contact.sql']) {
    await admin.query(await readFile(path.join(root,'../supabase/migrations',migration),'utf8'));
  }
  await admin.query(`insert into auth.users(id,email,raw_user_meta_data) values ($1,'seller@example.test','{"rol":"vendedor"}'),($2,'buyer@example.test','{}'),($3,'other@example.test','{}');`,[seller,buyer,other]);
  await admin.query("insert into categorias(nombre) values ('Prueba sprint 4')");
  const product = async (stock) => (await admin.query("insert into productos(vendedor_id,categoria_id,nombre,precio_original,precio_actual,fecha_vencimiento,stock,modalidad_entrega) values($1,1,'Prueba sprint 4',10,5,'2099-01-01',$2,'recojo') returning id",[seller,stock])).rows[0].id;
  const snapshot = async (id) => (await admin.query(`select stock,
    (select count(*)::int from detalle_pedidos where producto_id=$1) as detalles,
    (select count(*)::int from pedidos where id in(select pedido_id from detalle_pedidos where producto_id=$1)) as pedidos
    from productos where id=$1`,[id])).rows[0];
  const a = await connect('sprint4-a'), b = await connect('sprint4-b'), gate = await connect('sprint4-gate');
  const rpcFor = (c) => async (_name, p) => {
    try { const r = await c.query('select * from crear_pedido_transaccion($1,$2,$3,$4,$5,$6)',[p.p_producto_id,p.p_comprador_id,p.p_cantidad,p.p_modalidad_entrega,p.p_referencia_entrega,p.p_clave_idempotencia]); return {data:r.rows,error:null}; }
    catch(e) { return {data:null,error:{code:e.code,message:e.message}}; }
  };
  const buy = (c, id, cantidad, n, actor = buyer) => crearPedido({id:actor,rol:'comprador'}, {
    productoId:id,cantidad,modalidadEntrega:'recojo',claveIdempotencia:key(n)
  }, { rpc: rpcFor(c) });
  let id = await product(3);
  const before = await snapshot(id);
  await admin.query('update productos set precio_actual=4 where id=$1',[id]);
  const first = await buy(a,id,2,1);
  assert.equal(first.estado,'creado'); assert.equal(Number(first.monto_total),8);
  const retry = await buy(a,id,2,1); assert.equal(retry.id,first.id);
  const after = await snapshot(id); assert.deepEqual(after,{stock:1,detalles:1,pedidos:1});
  evidence.push({caso:'Compra válida con precio vigente y reintento',antes:before,despues:after,estado:first.estado,monto:Number(first.monto_total)});
  await assert.rejects(buy(a,id,2,2),e=>e.status===409);
  assert.deepEqual(await snapshot(id),after);
  evidence.push({caso:'Cantidad superior al stock',resultado:'409',antes:after,despues:await snapshot(id)});

  async function concurrent(id, attempts) {
    await gate.query('begin'); await gate.query('select id from productos where id=$1 for update',[id]);
    const results = Promise.allSettled(attempts.map(fn=>fn()));
    let waiting = 0;
    try {
      for(let n=0;n<100;n++) {
        waiting = Number((await admin.query("select count(*) as n from pg_stat_activity where application_name in ('sprint4-a','sprint4-b') and wait_event_type='Lock'")).rows[0].n);
        if(waiting===2) break;
        await new Promise(r=>setTimeout(r,25));
      }
      assert.equal(waiting,2,'Deben existir dos conexiones esperando un bloqueo real');
    } finally { await gate.query('commit'); }
    return results;
  }
  id=await product(3);
  let results=await concurrent(id,[()=>buy(a,id,2,3),()=>buy(b,id,2,4,other)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.filter(r=>r.status==='rejected' && r.reason.status===409).length,1);
  assert.deepEqual(await snapshot(id),{stock:1,detalles:1,pedidos:1});
  evidence.push({caso:'Dos compradores concurrentes piden 2 de las mismas 3 unidades',conexionesBloqueadas:2,resultados:['éxito','409'],antes:{stock:3},despues:await snapshot(id)});
  id=await product(3);
  results=await concurrent(id,[()=>buy(a,id,2,5),()=>buy(b,id,2,5)]);
  assert(results.every(r=>r.status==='fulfilled'));
  assert.equal(results[0].value.id,results[1].value.id);
  assert.deepEqual(await snapshot(id),{stock:1,detalles:1,pedidos:1});
  evidence.push({caso:'Misma clave enviada desde dos conexiones simultáneas',mismoPedido:true,antes:{stock:3},despues:await snapshot(id)});
  // Rutas/controlador/validación/servicio reales y SQL persistido. Solo la
  // verificación de identidad sustituye Supabase Auth por una cuenta ficticia.
  supabaseAdmin.auth.getUser = async token => token === 'local-buyer'
    ? {data:{user:{id:buyer}},error:null} : {data:{user:null},error:{message:'Token inválido'}};
  supabaseAdmin.from = table => {
    assert.equal(table,'perfiles');
    let actor;
    return {select(){return this;},eq(_field,value){actor=value;return this;},async single(){
      return {data:(await admin.query('select * from perfiles where id=$1',[actor])).rows[0],error:null};
    }};
  };
  supabaseAdmin.rpc = rpcFor(admin);
  const app = createApp();
  id=await product(3);
  const apiBefore=await snapshot(id);
  const payload={productoId:Number(id),cantidad:2,modalidadEntrega:'recojo',claveIdempotencia:key(6),precio:0.01,monto_total:0.02};
  const created=await request(app).post('/api/pedidos').set('Authorization','Bearer local-buyer').send(payload);
  assert.equal(created.status,201); assert.equal(created.body.estado,'creado'); assert.equal(Number(created.body.monto_total),10);
  const apiAfter=await snapshot(id); assert.deepEqual(apiAfter,{stock:1,detalles:1,pedidos:1});
  const conflict=await request(app).post('/api/pedidos').set('Authorization','Bearer local-buyer').send({...payload,claveIdempotencia:key(7)});
  assert.equal(conflict.status,409); assert.equal(conflict.body.code,'DATA_CONFLICT');
  assert.deepEqual(await snapshot(id),apiAfter);
  evidence.push({caso:'POST /api/pedidos con SQL real e identidad ficticia',antes:apiBefore,
    compra:{status:created.status,body:created.body},despues:apiAfter,
    sobrestock:{status:conflict.status,body:conflict.body},despuesDelConflicto:await snapshot(id)});
  if (process.argv.includes('--sprint56')) {
    id = await product(3);
    const pending = await buy(a,id,2,80);
    const cancel = async c => (await c.query("select * from cancelar_pedido_transaccion($1,$2,'Cambio de planes')",[pending.id,buyer])).rows[0];
    const canceled = await concurrent(id,[()=>cancel(a),()=>cancel(b)]);
    assert(canceled.every(r=>r.status==='fulfilled' && r.value.estado==='cancelado'));
    assert.deepEqual(await snapshot(id),{stock:3,detalles:1,pedidos:1});
    const notices = await admin.query("select count(*)::int as n from notificaciones where mensaje=$1",['Pedido N.° '+pending.id+' cancelado por el comprador']);
    assert.equal(notices.rows[0].n,1);
    evidence.push({caso:'S5: cancelaciones simultáneas',antes:{stock:1,estado:'creado'},despues:{stock:3,estado:'cancelado'},avisos:1});
    id = await product(3);
    const delivered = await buy(a,id,2,81);
    await admin.query("update pedidos set estado='entregado' where id=$1",[delivered.id]);
    await assert.rejects(a.query("select * from cancelar_pedido_transaccion($1,$2,'Motivo')",[delivered.id,buyer]));
    assert.equal((await snapshot(id)).stock,1);
    evidence.push({caso:'S5: entregado rechazado',stockAntes:1,stockDespues:1});
    await admin.query("update pedidos set estado='completado' where id=$1",[delivered.id]);
    const ratings = await Promise.allSettled([a,b].map(c=>c.query('insert into calificaciones(pedido_id,puntaje) values($1,5) returning id',[delivered.id])));
    assert.equal(ratings.filter(r=>r.status==='fulfilled').length,1);
    assert.equal(ratings.filter(r=>r.status==='rejected' && r.reason.code==='23505').length,1);
    evidence.push({caso:'S6: dos calificaciones simultáneas',registros:1,rechazos:1});
  }
  const report={fecha:new Date().toISOString(),postgres:(await admin.query('select version() as version')).rows[0].version,entorno:'PostgreSQL local efímero, conexiones independientes; sin Supabase remoto',evidence};
  const output=path.join(root,process.argv.includes('--sprint56') ? '../docs/evidencias/sprints-05-06' : '../docs/evidencias/sprint-04'); await mkdir(output,{recursive:true});
  await writeFile(path.join(output,'concurrencia.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
} finally {
  await Promise.allSettled(clients.map(c=>c.end()));
  if(started) await command('pg_ctl',['-D',data,'-m','fast','-w','stop']);
}
