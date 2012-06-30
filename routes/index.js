//GET home page
app.get('/', function(req, res)
{
  res.render('index', { title: 'wdib', channel_id: '' });
});