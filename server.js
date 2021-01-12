const http = require('http');
const fs = require('fs');
const pug = require('pug');

//Initialize the names list sent to the client to build dropdown
let names = [];
//Initialize the restaurant data list sent to the client to build order page
let resData = [];
//Initialize the list that stores the orders for each restaurant
let resOrders = [];

//Initialize pug files for Home page and Stats page
const renderHome = pug.compileFile('views/pages/index.pug');
const renderStats = pug.compileFile('views/pages/stats.pug');

//read JSON files into initialized lists above one server startup
var files = fs.readdirSync('./restaurants');
    for (var i in files) {
		var obj;
		fs.readFile(process.cwd()+"/restaurants/"+files[i], 'utf8', function (err, data) {
			if (err) throw err;
			obj = JSON.parse(data);
			//add JSON file to resData
			resData.push(obj);
			//add name of restaurant to names
			names.push(obj.name);
			//initialize new object for restaurant that stores useful information about it's orders
			resOrders.push({name: obj.name, orders: [], ordersCombined: {}, totalPrice: 0, stats: ["The number of orders is: 0","The average total is: 0","The most popular item is: "]});

		});
    }

//function to update the information stored in the restaurantOrders array
function update(data, res, total){
	//gets the current restaurant of the order sent from client
	let currentResData = {};
	for (let i = 0; i< resData.length;i++){
		if (resData[i].name === res){
			currentResData = resData[i];
		}
	}

	let j = 0;
	//the order sent from client
	let totaldata = JSON.parse(data);
	for (let i = 0; i < resOrders.length;i++){
		
		//Check to update the correct order data
		if (resOrders[i].name === res) {

			//increment the current total price
			resOrders[i]["totalPrice"]+=parseFloat(total);
			
			//push the order into the orders array
			resOrders[i].orders.push(totaldata);
			
			//reset the combined orders object so that we account for duplicates
			resOrders[i].ordersCombined = {};
			
			//loop through the orders in the orders array
			for (j = 0; j< resOrders[i].orders.length;j++){
				let currOrder = Object.keys(resOrders[i].orders[j]);
				
				//loop through the keys in each order
				for (let k = 0;k < Object.keys(resOrders[i].orders[j]).length;k++){
					
					//combine the order into one big order object for the restaurant
					combineOrders(resOrders[i].ordersCombined,currOrder[k],resOrders[i].orders[j][currOrder[k]]);
				}
			}
			//Make sure the stats we need to send to pug are updated properly
			resOrders[i]["stats"][0] = "The number of orders is: " +j;
			resOrders[i]["stats"][1] = "The average total is: "+(resOrders[i]["totalPrice"]/j).toFixed(2)+"$";
			resOrders[i]["stats"][2] = "The most popular item is: " + findMax(resOrders[i]);
		}
	}
}
//Helper function to combine the many smaller orders into one big one for each restaurant
function combineOrders(ordersCombined, key, val){
	if(ordersCombined.hasOwnProperty(key)){
		ordersCombined[key] += val;
	}else{
		ordersCombined[key] = val;
	}
}
//Helper function to find the food item with the highest frequency out of all the orders for the restaurant
function findMax(resOrders){
	let keys = Object.keys(resOrders.ordersCombined);
	let currentMax = 0;
	let currentMaxKey = "";
	for (let i = 0; i < keys.length;i++){
		if (resOrders.ordersCombined[keys[i]] > currentMax){
			currentMax = resOrders.ordersCombined[keys[i]];
			currentMaxKey = keys[i];
		}
	}

	let output = mostPopular(resOrders,currentMaxKey); 
	return output;
	
}
//Helper function to get the name of the 
function mostPopular(resOrders,maxKey){
	let currentResData = {};
	for (let i = 0; i< resData.length;i++){
		if (resData[i].name === resOrders.name){
			currentResData = resData[i];
		}
	}
	let maxName = "";
	//for each category on menu
	Object.keys(currentResData["menu"]).forEach(key =>{
					
	//For each menu item in the category
		Object.keys(currentResData["menu"][key]).forEach(id => {
			if (id === maxKey){
				maxName = currentResData["menu"][key][id].name;
			}
		});
	});
	return maxName;
}
//Helper function to send a 404 error
function send404(response){
	response.statusCode = 404;
	response.write("Unknown resource.");
	response.end();
}

//Helper function to send a 500 error
function send500(response){
	response.statusCode = 500;
	response.write("Server error.");
 	response.end();
}
const server = http.createServer(function (request, response) {
	/*
		GET:
		/ --> go to orderform.html
		/orderform.html
		/client.js
		/add.jpg
		/remove.jpg
		/menu-data/{restaurant-name}
		/restaurant-names
	*/
	if (request.method === "GET"){
		
		if (request.url === "/"){
			
			let data = renderHome({});
			response.statusCode = 200;
			response.end(data);
			return;
			
		}else if(request.url === "/stats"){
			
			let data = renderStats({resOrders});
			response.statusCode = 200;
			response.end(data);
			
		}else if (request.url == "/orderform"){	
		
			fs.readFile("orderform.html", function(err,data){
				if (err){
					send500(response);
				}
				response.statusCode = 200;
				response.end(data);
			});
		
		}else if (request.url === "/client.js"){
			
			fs.readFile("client.js",  function(err,data){
				if (err){
					send500(response);
				}
				response.statusCode = 200;
				response.setHeader("Content-Type","application/javascript");
				response.end(data);
			});
			
		}else if (request.url === "/add.jpg"){
			
			fs.readFile("add.jpg",  function(err,data){
				if (err){
					send500(response);
				}
				response.writeHead(200,{"Content-Type":"image/jpeg"});
				response.end(data);
			});
			
		}else if (request.url === "/remove.jpg"){
			
			fs.readFile("remove.jpg",  function(err,data){
				if (err){
					send500(response);
				}
				response.writeHead(200,{"Content-Type":"image/jpeg"});
				response.end(data);
			});
			
		}else if (request.url === "/restaurant-names"){
			
			response.statusCode = 200;
			response.setHeader("Content-Type", "application/json");
			response.write(JSON.stringify(names));
			response.end();
			
		}else if (request.url.startsWith("/menu-data/")){
			//break the url into chunks
			let urlChunks = request.url.split('/');
			//the last element in urlChunks is the total cost of that order
			let currentRes = urlChunks[urlChunks.length - 1]
			//set the "-" to spaces
			currentRes = currentRes.replace(/-/g, ' ');
			
			let resIndex = 0;
			for (let i = 0; i < names.length;i++){
				if (names[i].localeCompare(currentRes) == 0){
					resIndex = i;
				}
			}
			response.statusCode = 200;
			response.setHeader("Content-Type", "application/json");
			response.write(JSON.stringify(resData[resIndex]));
			response.end();
			
		}else{
			send404(response);
		}
	/*
		POST:
		/restaurant-stats/{restaurant-name}/{order-total}
	*/
	}else if (request.method === "POST"){
		if(request.url.startsWith("/restaurant-stats")){
			//break the url into chunks
			let urlChunks = request.url.split('/');
			//the second to last element in urlChunks is the current restaurant
			//decode the url chunk
			let res = decodeURI(urlChunks[urlChunks.length - 2])
			//the last element in urlChunks is the total cost of that order
			let total = urlChunks[urlChunks.length-1]
			
			let body = "";
			request.on('data', (chunk) => {
				body += chunk;
			});
			request.on('end', (chunk) => {
				//update the stats from the client data
				update(body,res,total);
			});
			
			response.statusCode = 200;
			response.setHeader("Content-Type", "text/plain");
			response.write("Order successfully Sent to server! ");
			response.end();
			
		}else{
			send404(response);
		}
	}
}).listen(3000);
console.log("Server listening at port: 3000");