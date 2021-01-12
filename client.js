//The definition of the menu items are left so that the base code works.
//You should remove these for your A2 implementation, as all data should come from the server


let names = [];
let menu = [];

//The drop-down menu
let select = document.getElementById("restaurant-select");
//Stores the currently selected restaurant index to allow it to be set back when switching restaurants is cancelled by user
let currentSelectIndex = select.selectedIndex
//Stores the current restaurant to easily retrieve data. The assumption is that this object is following the same format as the data included above. If you retrieve the restaurant data from the server and assign it to this variable, the client order form code should work automatically.
let currentRestaurant;
//Stored the order data. Will have a key with each item ID that is in the order, with the associated value being the number of that item in the order.
let order = {};
let total = 0;

//Called on page load. Initialize the drop-down list.
function init(){
	genDropDownList();
}

//Generate new HTML for a drop-down list containing all restaurants.
//Moved some function calls from the init() function into the GET request
//also moved the code that was in the function originally into the request
function genDropDownList(){
	let request = new XMLHttpRequest();
	
	request.onreadystatechange = function(){	
		if(this.readyState == 4 && this.status == 200){ //if its reggie
			let data = JSON.parse(request.responseText);
			//set names equal to the data from the server
			
			names = data;
			let result = '<select name="restaurant-select" id="restaurant-select">';
			for (let elem in names){
				result += `<option value="${names[elem]}">${names[elem]}</option>`
			}
			result += "</select>";
			document.getElementById("restaurant-select").innerHTML = result;
			document.getElementById("restaurant-select").onchange = selectRestaurant;
			selectRestaurant();
		}
	}
	request.open("GET","http://localhost:3000/restaurant-names",true);
	request.send();
	
	//Create dropdown list by returning the inner html based on the names array

	
}

//Called when drop-down list item is changed.
//Creates get request to server for restaurant data
//Moved the code in the function inside the request
function selectRestaurant(){
	let select = document.getElementById("restaurant-select");
	let name = select.options[select.selectedIndex]
	//checks for undefined
	if (name !== undefined){
		//creates custom url that tells server what the currently selected restaurant is
		name= select.options[select.selectedIndex].text;
		name = name.replace(/\s+/g, '-');
		let request = new XMLHttpRequest();
	
		request.onreadystatechange = function(){	
			if(this.readyState == 4 && this.status == 200){ //if its reggie
				let data = JSON.parse(request.responseText);
				//set menu[0] equal to the data from the server
				menu[0] = data;
				console.log(menu);
				let result = true;
	
				//If order is not empty, confirm the user wants to switch restaurants.
				if(!isEmpty(order)){
					result = confirm("Are you sure you want to clear your order and switch menus?");
				}
	
				//If switch is confirmed, load the new restaurant data
				if(result){
					//Get the selected index and set the current restaurant
					let selected = select.options[select.selectedIndex].value;
					currentSelectIndex = select.selectedIndex;
					//In A2, current restaurant will be data you received from the server
					currentRestaurant = menu[0];
		
					//Update the page contents to contain the new menu
					if (currentRestaurant !== undefined){
						document.getElementById("left").innerHTML = getCategoryHTML(currentRestaurant);
						document.getElementById("middle").innerHTML = getMenuHTML(currentRestaurant);
					}
					//Clear the current oder and update the order summary
					order = {};
					updateOrder(currentRestaurant);
		
					//Update the restaurant info on the page
					let info = document.getElementById("info");
					info.innerHTML = currentRestaurant.name + "<br>Minimum Order: $" + currentRestaurant.min_order + "<br>Delivery Fee: $" + currentRestaurant.delivery_fee + "<br><br>";
				}else{
					//If they refused the change of restaurant, reset the selected index to what it was before they changed it
					let select = document.getElementById("restaurant-select");
					select.selectedIndex = currentSelectIndex;
				}
			}
		}
		//make request to server with custom url based on the currently selected restaurant
		request.open("GET","http://localhost:3000/menu-data/"+name,true);
		request.send();
	}
}

//Given a restaurant object, produces HTML for the left column

function getCategoryHTML(rest){
	let menu = rest.menu;
	let result = "<b>Categories<b><br>";
	Object.keys(menu).forEach(key =>{
		result += `<a href="#${key}">${key}</a><br>`;
		console.log(key);
	});
	return result;
}

//Given a restaurant object, produces the menu HTML for the middle column
function getMenuHTML(rest){
	let menu = rest.menu;
	let result = "";
	//For each category in the menu
	Object.keys(menu).forEach(key =>{
		result += `<b>${key}</b><a name="${key}"></a><br>`;
		//For each menu item in the category
		Object.keys(menu[key]).forEach(id => {
			item = menu[key][id];
			result += `${item.name} (\$${item.price}) <img src='add.jpg' style='height:20px;vertical-align:bottom;' onclick='addItem(${id})'/> <br>`;
			result += item.description + "<br><br>";
		});
	});
	return result;
}
//helper function to get the currentRestaurant data
function getCurrentRestaurant(){
	if (menu[0] !== undefined){
		return menu[0];
	}
}
//Responsible for adding one of the item with given id to the order and updating the summary
function addItem(id){
	if(order.hasOwnProperty(id)){
		order[id] += 1;
	}else{
		order[id] = 1;
	}
	//gets the current restaurant and ensures that it is not undefined
	temp = getCurrentRestaurant();
	if (temp !== undefined){
		updateOrder(temp);
	}
}

//Responsible for removing one of the items with given id from the order and updating the summary
function removeItem(id){
	if(order.hasOwnProperty(id)){
		order[id] -= 1;
		if(order[id] <= 0){
			delete order[id];
		}
		temp = getCurrentRestaurant();
		if (temp !== undefined){
			updateOrder(temp);
		}
	}
}

//Reproduces new HTML containing the order summary and updates the page
//This is called whenever an item is added/removed in the order
function updateOrder(currentRestaurant){
	let result = "";
	let subtotal = 0;
	
	//For each item ID currently in the order
	Object.keys(order).forEach(id =>{
		//Retrieve the item from the menu data using helper function
		//Then update the subtotal and result HTML
		let item = getItemById(id);
		subtotal += (item.price * order[id]);
		result += `${item.name} x ${order[id]} (${(item.price * order[id]).toFixed(2)}) <img src='remove.jpg' style='height:15px;vertical-align:bottom;' onclick='removeItem(${id})'/><br>`;
	});
	
	//Add the summary fields to the result HTML, rounding to two decimal places
	result += `Subtotal: \$${subtotal.toFixed(2)}<br>`;
	result += `Tax: \$${(subtotal*0.1).toFixed(2)}<br>`;
	result += `Delivery Fee: \$${currentRestaurant.delivery_fee.toFixed(2)}<br>`;
	total = subtotal + (subtotal*0.1) + currentRestaurant.delivery_fee;
	result += `Total: \$${total.toFixed(2)}<br>`;
	//Decide whether to show the Submit Order button or the Order X more label
	if(subtotal >= currentRestaurant.min_order){
		result += `<button type="button" id="submit" onclick="submitOrder()">Submit Order</button>`
	}else{
		result += `Add \$${(currentRestaurant.min_order - subtotal).toFixed(2)} more to your order.`;
	}
	
	document.getElementById("right").innerHTML = result;
}

//Simulated submitting the order
//Post request to server with order data, currently selected restaurant and order total
function submitOrder(){
	
	total = total.toFixed(2);
	let request = new XMLHttpRequest();
	let temp = getCurrentRestaurant();
	request.onreadystatechange = function(){	
		if(this.readyState == 4 && this.status == 200){ //if its reggie
			console.log(this.responseText);
			alert("Order placed!")
			//reset order
			order = {};
			selectRestaurant();
		}
	}
	//custom url that tells the server the currently selected restaurant and the order 
	request.open("POST","http://localhost:3000/restaurant-stats/"+temp.name+"/"+total,true);
	request.setRequestHeader('Content-type', 'application/json');
	request.send(JSON.stringify(order));
}

//Helper function. Given an ID of an item in the current restaurant's menu, returns that item object if it exists.
function getItemById(id){
	let categories = Object.keys(currentRestaurant.menu);
	for(let i = 0; i < categories.length; i++){
		if(currentRestaurant.menu[categories[i]].hasOwnProperty(id)){
			return currentRestaurant.menu[categories[i]][id];
		}
	}
	return null;
}

//Helper function. Returns true if object is empty, false otherwise.
function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}