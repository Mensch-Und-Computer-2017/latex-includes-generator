#!/usr/bin/env node

/* eslint-env node */
'use strict';

const fs = require('fs'),
  xml2js = require('xml2js'),
  mkdirp = require('mkdirp'),
  NEW_LINE_CHAR = '\n',
  AUTHOR_CONCAT_SYMBOL = ' & ',
  UNSORTED_PAPER_SESSION = 'No-Session',
  CSV_FILE_NAME_TEMPLATE = '{{directory}}/{{name}}.csv',
  CSV_HEADER = 'ID|path|title|authors|doi|track',
  CSV_LINE_TEMPLATE = '{{ID}}|{{PATH}}|{{TITLE}}|{{AUTHORS}}|{{DOI}}|{{TRACK}}';

var program = require('commander');

program
  .version('0.0.1')
  .option('-i, --input [value]', 'Input file', './submissions.xml')
  .option('-s, --singlefile [value]', 'Generate single output file instead of multiple session based files')
  .option('-o, --output [value]', 'Output directory', './out')
  .parse(process.argv);

function log(msg) {
  console.log(msg); // eslint-disable-line
}

function printSessiontToSingleFile(outputFile, sessionList) {
  let content = CSV_HEADER + NEW_LINE_CHAR;
  for (let key in sessionList) {
    if (sessionList.hasOwnProperty(key)) {
      let lines = sessionList[key].split('\n');
      lines.shift();
      content += lines.join('\n') + NEW_LINE_CHAR;
    }
  }
  log('Writing file: ' + outputFile);
  fs.writeFileSync(outputFile, content);
}

function printSessionListsToFiles(outputDirectory, sessionList) {
  for (let key in sessionList) {
    if (sessionList.hasOwnProperty(key)) {
      let file = CSV_FILE_NAME_TEMPLATE.replace('{{directory}}', outputDirectory).replace('{{name}}', key);
      mkdirp.sync(outputDirectory); 
      log('Writing file: ' + file);
      fs.writeFileSync(file, sessionList[key]);
    }
  }
}

function printSessionList(output, singlefile, sessionList) {
  if (singlefile) {
    printSessiontToSingleFile(output, sessionList);
  } else {
    printSessionListsToFiles(output, sessionList);
  }
}

function concatAuthors(authors) {
  var authorNames;
  if (!(authors instanceof Array)) {
    return authors.name;
  }
  authorNames = authors.map(function(author) {
    return author.name;
  });
  return authorNames.join(AUTHOR_CONCAT_SYMBOL);
}

function createCSVStringFromSession(session) {
  var csvData = CSV_HEADER;
  for (let i = 0; i < session.length; i++) {
    let paper = session[i],
      authors = concatAuthors(paper.authors.author),
      line = CSV_LINE_TEMPLATE.replace('{{ID}}', paper.id).replace('{{PATH}}', paper.pathInProceedings).replace('{{TITLE}}', paper.title).replace('{{AUTHORS}}', authors).replace('{{DOI}}', paper.doi).replace('{{TRACK}}', paper.session.shortTitle);
    csvData += NEW_LINE_CHAR + line;
  }
  return csvData;
}

function generateSessionLists(sessions) {
  var lists = {};
  log('Generating csv list from sessions');
  return new Promise(function(resolve) {
    for (let key in sessions) {
      if (sessions.hasOwnProperty(key)) {
        let sessionKey = key.split(' ')[0];
        lists[sessionKey] = createCSVStringFromSession(sessions[key]);
      }
    }
    resolve(lists);
  });

}

function countPapersInSession(sessions) {
  var count = 0;
  for (let key in sessions) {
    if (sessions.hasOwnProperty(key)) {
      count += sessions[key].length;
    }
  }
  return count;
}

function sortPapersInSession(sessions) {
  log('Sorting papers in sessions');
  for (let key in sessions) {
    if (sessions.hasOwnProperty(key)) {
      sessions[key] = sessions[key].sort(function(a, b) {
        let idPaperA = parseInt(a.positionInSession),
          idPaperB = parseInt(b.positionInSession);
        return idPaperA - idPaperB;
      });
    }
  }
  return sessions;
}

function addPaperToSessions(sessions, paper) {
  if (paper.isAccepted === 'false') {
    return sessions;
  }
  if (paper.session.shortTitle === '') {
    paper.session.shortTitle = UNSORTED_PAPER_SESSION;
  }
  if (!sessions[paper.session.shortTitle]) {
    sessions[paper.session.shortTitle] = [];
  }
  sessions[paper.session.shortTitle].push(paper);
  return sessions;
}

function groupSessions(papers) {
  var sessions = {};
  log('Mapping papers to sessions');
  return new Promise(function(resolve) {
    for (let i = 0; i < papers.length; i++) {
      let paper = papers[i];
      sessions = addPaperToSessions(sessions, paper);
    }
    sessions = sortPapersInSession(sessions);
    log('Found ' + Object.getOwnPropertyNames(sessions).length + ' sessions [' + countPapersInSession(sessions) + ' papers remaining]');
    resolve(sessions);
  });
}

function loadData(file) {
  var parser = new xml2js.Parser({ explicitArray: false });
  log('Loading data from: ' + program.input);
  return new Promise(function(resolve, reject) {
    fs.readFile(file, function(err, data) {
      if (err) {
        reject(err);
      }
      parser.parseString(data, function(err, result) {
        if (err) {
          reject(err);
        }
        log('Found ' + result.papers.paper.length + ' papers');
        resolve(result.papers.paper);
      });
    });
  });
}

function run() {
  log('Generating include list for latex workflow');
  loadData(program.input).then(groupSessions).then(generateSessionLists).then(printSessionList.bind(this, program.output, program.singlefile));
}

run();