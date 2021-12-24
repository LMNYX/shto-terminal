const fastify = require('fastify')();
const path = require('path');
const terminal = require('./terminal.js');

fastify.register(require('point-of-view'), {
  engine: {
    eta: require('eta')
  }
})
fastify.register(require('fastify-static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/public/',
  })

  fastify.get('/', (req, res) => {
    res.view(__dirname + '/layouts/home.ejs')
});
fastify.get('/ps', (req, res) => {
  res.view(__dirname + '/layouts/ps-login.ejs')
});
fastify.get('/_expErr', (req, res) => {
  res.view(__dirname + '/layouts/bluescreen.ejs')
});
fastify.get('/invitation', (req, res) => {
  res.view(__dirname + '/layouts/invitation.ejs')
});

fastify.post('/terminal/call', (req,res)=>{
  return terminal.run(req);
  
});
fastify.post('/terminal/init', (req,res)=>{
  return terminal.init(req);
});

fastify.setNotFoundHandler((request, reply) => {
  reply.code(404).type('text/html');
  reply.view(__dirname + '/layouts/messageterminal.ejs', {'message': 'ERROR: There is no directory or script with such name.'});
})

fastify.setErrorHandler(function (error, request, reply) {
  this.log.error(error)
  reply.status(409).view(__dirname + '/layouts/messageterminal.ejs', {'message': 'Severe damage on the VM is detected. Please reboot the system to run CHKDSK.\n'+error})
})

fastify.listen(3000,
  //'10.1.0.4',
  err => {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})