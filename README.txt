name: Daniel Violin
student number: 101173598

1. Navigate to location of assignment2 inside terminal
2. Run 'npm install pug' at this location
3. Run 'node server.js'
4. Navigate to http://localhost:3000/ to access home page
   Navigate to http://localhost:3000/orderform to access orderform page
   Navigate to http://localhost:3000/stats to stats page

Design Choices:

- Firstly, I decided to use the starter code for the client.js and orderform.html provided to us in the assignment.
  I did this because my code from A1 (although it met all specifications) was much less organized than the starter code.

- Secondly, I chose to use custom urls, like querystrings (kind of), that are concactenated to the end of the normal url.
  These custom additions to the urls tell the server important information (mainly about the currently selected restaurant
  and the total cost of the order to avoid repeating code).

- Thirdly, I decided to use helper functions on my server to handle the orders being sent since I didnt think it was 
  productive to send them to the client to be read and back again. These helper functions output the correct stats to their
  respective object inside the list. It's a bit cluttered in the server but I think it's cleaner than having everything in the
  route to the POST request.

- Lastly, I decided to use pug because I prefer it over ejs.

