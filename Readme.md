# A node.js cli tool to generate individual session list as csv files [Specifically used for MuC 2017 publishing workflow]

This tool reads processed input data (see (cftool-xml-processor)[https://github.com/Mensch-Und-Computer-2017/cftool-xml-processor]) from ConfTool and exports multiple CSV files. For each session a file is created including all presented papers.

## Install

* Make sure Node.js (> 6.0) is installed.
* Clone repository and run `npm install`.

## Create Lists

Run `./generate.js` to create csv list

## Output format

For each session a file is created. The filename is based on the session title. The file's content looks like this:

```
ID|path|title|authors|doi|track
{{ID}}|{{PATH}}|{{TITLE}}|{{AUTHORS}}|{{DOI}}|{{TRACK}}
```

where the placeholders are replaced by the actual paper data.


### Options

| Option					| Description				| Default Value		| Allowed Values 								|
|---------------------------|---------------------------|-------------------|-----------------------------------------------|
| -V, --version         	| output the version number |					|		 										|
| -i, --input [value]   	| Input file 				| ./submissions.xml | String 										|
| -o, --output [value]  	| Output directory			| ./out 			| String										|
| -h, --help            	| output usage information  |					|												|
