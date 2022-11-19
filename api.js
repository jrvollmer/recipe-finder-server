// Server and requests
import { Router } from "express";
import url from "url";
import ROUTES from "./routes.json" assert { type: "json" };
// Database
import sqlite3 from "sqlite3";
// Files
import fs from "fs";
import { existsSync } from 'node:fs';
import path from "path";
import TEST_RESPONSE from "./test-response.json" assert { type: "json" };



// --------------------------------------- SQLITE3 DATABASE --------------------------------------

// Open test.db database for reading and writing, or create the database if it doesn't exist
let test_db = new sqlite3.Database('./test.db', (err) => {// TODO sqlite3.OPEN_READWRITE, (err) => {
	if(err && err.code == "SQLITE_CANTOPEN") {
		createDatabase();
		return;
	} else if(err) {
		console.log("Errored out initializing test_id: " + err);
		// TODO exit(1);
	}
	
	console.log('created the database in the first function');
	createTable(test_db);
});


function createDatabase() {
	test_db = new sqlite3.Database('test.db', (err) => {
		if(err) {
			console.log("Errored out: " + err);
			// TODO exit(1);
		}
		console.log('created the database');
		createTable(test_db);
	});
}

function createTable(db) {
	db.exec(`
		create table testTable (
			test_id int primary key not null,
			name text not null,
			test_flag text not null
		);
		insert into testTable (test_id, name, test_flag)
			values
				(1, 'Name 1', 'T'),
				(2, 'Name 2', 'F'),
				(3, 'Name 3', 'F');
		`, () => {
			console.log('Created the table');
			runQueries(db);
	});
}

function insertIntoTable(db, id, name, flag) {
	db.exec(`
		insert into testTable (test_id, name, test_flag)
			values (${id}, '${name}', '${flag}');
		`, () => {
			/* TODO console.log(`
			insert into testTable (test_id, name, test_flag)
				values (${id}, '${name}', '${flag}');
			`);*/
			runQueries(db);
	});
}

function runQueries(db) {
	/*TODO db.all(`
		select test_id, name, test_flag from testTable t
		where test_id >= ?`, 2, (err, rows) => {
			// TODO rows.forEach(row => {
			// TODO	console.log(row.test_id + '\t' + row.name + '\t' + row.test_flag);
			// TODO });
		}
	);*/
	
	// TODO console.log('--------------------------------------------------------------');
	
	db.all(`select max(test_id) from testTable;`, (err, rows) => {
		//rows.forEach(row => {
		console.log('max(test_id): ' + rows[0]['max(test_id)']);
		//});
	}); 
	
	/*db.all(`select * from testTable;`, (err, rows) => {
		rows.forEach(row => {
			console.log(row.test_id + '\t' + row.name + '\t' + row.test_flag);
		});
	});*/
}



// ------------------------------------ HTTP REQUEST HANDLING ------------------------------------

const test_response = TEST_RESPONSE;

let resp_counter = 0;

const ROUTER = Router();


// TODO Generic HTTP request that increments a counter
ROUTER.get(ROUTES['COUNTER'], (req, res) => {
	resp_counter ++;
	console.log("counter request", resp_counter);
	if(resp_counter > 3) {
		insertIntoTable(test_db, resp_counter, "Name " + resp_counter, 'T');
	}
	const temp = res.send({ response: test_response, count: resp_counter }).status(200);
});


// HTTP request for retrieving images from the server
ROUTER.get(ROUTES['RETRIEVE_IMAGE'], (req, res) => {
	// TODO Remove
	console.log("retrieve images request");
	
	// Parse the request
	const request = url.parse(req.url, true);
	
	// Get the path from the request
	const reqPath = request.pathname;
	
	// Get file name from request path
	const fname = reqPath.split('/')[reqPath.split('/').length - 1];//"pic.png";
	
	// Create image file path
	const fpath = path.join(".", reqPath).split("%20").join(" ");
	
	// TODO Remove	
	console.log("Request path: " + reqPath + "\tFile name: " + fname + "\tFile path: " + fpath);
	
	// Check if the path exists
	fs.exists(fpath, (exists) => {
		if(!exists) {
			res.writeHead(404, { "Content-Type": "text/plain" });
			res.end("404 Not Found");
			return;
		}

		// Extract file extension
		var ext = path.extname(fname);
		
		// Setting default Content-Type
		var contentType = "text/plain";
		
		// Checking if the extension of the image is '.png'
		if( ext === ".png") {
			contentType = "image/png";
		}
		
		// Setting the headers
		res.writeHead(200, { "Content-Type": contentType });
	
		// Reading the file
		fs.readFile(fpath, (err, content) => {
			// Serving the image
			res.end(content);
		});
	});
});


// HTTP request for uploading images to the server
ROUTER.post(ROUTES['UPLOAD_IMAGE'], (req, res) => {
	console.log('upload image request');	

	// Get headers
	const headers = req.headers;
	
	// Get file name from headers
	const filename = headers['content-disposition'].split('"')[1];
	
	// Get file extension from headers
	const extension = headers['content-type'].split('/')[1];
	
	// Set initial file path
	let filepath = './recipe-images/' + filename + '.' + extension;

	// Initialize the number of duplicate file paths that exist
	let numDuplicates = 0;
	
	// Add duplicate number to filename if the file already exists
	// TODO Probably want to remove this during actual implementation since duplicate file names should indicate modifying an image
	while(existsSync(filepath)) {
		// A duplicate was found, so generate a new file path/name
		numDuplicates ++;
		filepath = `./recipe-images/${filename}_${numDuplicates}.${extension}`;
		
		// TODO console.log(filepath);
	}

	console.log("Generated new file: " + filepath);
	
	// Event handler that runs when data is received from the request
	req.on('data', (data) => {
		//console.log('received data');
		
		// Write data to file
		fs.appendFile(filepath, data, (err) => {});
		//console.log(data);
	});
	
	// Event handler that runs when the request ends
	req.on('end', () => {
		console.log('ended');
	});
	
	// TODO console.log(req);
	console.log(req.headers);
	console.log(filepath);
});



export default ROUTER;
