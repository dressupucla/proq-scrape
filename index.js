#!/usr/bin/env node
var path = require('path')
  , jsdom = require('jsdom')
  , stringify = require('csv-stringify')
  , html = ''
  , rows = []

process.stdin.setEncoding('utf8');

process.stdin.on('readable', function(){
  var chunk = process.stdin.read();
  if (chunk !== null ) { html += chunk; }
})


process.stdin.on('end', function(){

  jsdom.env( html,["jquery.js"],
    function (err, window) {
      var $ = window.$
      $('body > div.coverPageHeader').remove()
      $('body > div.tableOfContent').remove()
      $('body > div.copyright').remove()
      $('body > div').each(function(){
        var row = {}

        // grab full text
        row.fulltext = $(this).children('p:not([style])').text().replace(/\n/g,' ')

        // keep track of metadata field key
        var key = ''

        // iterate over metadata fields
        $(this).children('p[style]').each(function(){

          // to test key change
          var last_key = key;

          // determine key
          var $key_elem = $('strong',this);
          if($key_elem.length){
            key = $key_elem.text().replace(/[^a-zA-Z]/g,'');
            $key_elem.remove();
          } else {
            // title field?
            if($(this).css('font-weight') == 'bold'){
              key = 'Title'
            }
          }

          // field value
          var txt = $(this).text().replace(/\n/g,' ');

          // skip field conditions
          if (!txt){ return; }
          if (txt == "ProQuest document link"){ return; }
          if (txt.match(/Abstract:\s*/)){ return; }
          if (txt.match(/^Document [0-9]+ of [0-9]+/)){return;}

          if(!key){
            process.stderr.write(`---Error: could not set key at text:\n${txt}\n`)
            process.exit(1)
          }

          if(key == last_key && key != "Abstract"){
            process.stderr.write(`---Error: non-abstract key didn't change near:\n${txt}\n`)
            process.exit(1)
          }

          if (row[key] && key == 'Abstract'){
            row[key] += txt
          } else {
            row[key] = txt
          }

        })
        rows.push(row);
      })
      stringify(rows, function(err, output){
        process.stdout.write(output);
      });
    }
  )

});
