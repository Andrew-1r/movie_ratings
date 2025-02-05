# TODO:
- each movie is calling API 9 different times
    - processed movies set not used?

- show rating of movie / tv show if found again in future slider

- do not show rating if none is found

- use some sort of broswer storage - indexedDB?

# What have I learned from the project so far
- How to use javascript directly in browser using chrome dev tools

- How to modify html/css elements on page using javascript

- How to interact with changing elements on a dynamic weeb page using javascript

# Getting movie titles:

## method to get information
must change titleCards to suit:
netflix - .title-card
stan - unsure maybe programs_item
disney - ._2c21371 (has heaps of extra stuff near title)

netflix games appear twice
- implement half the string, if 1st half == 2nd half nevermind it?

```javascript
// Select all title-card elements
const titleCards = document.querySelectorAll('.title-card');

// Loop through each title-card element and log the title and size
titleCards.forEach(card => {
    const title = card.getAttribute('aria-label') || card.textContent;  // Getting title from aria-label or text content
    const size = card.getBoundingClientRect();  // Getting the size of the title card (height, width, etc.)
    
    console.log('Title:', title);  // Log the title
    console.log('Size:', size);    // Log the size (bounding box info)
});


//Example reponse

Title: American Primeval
Size: {
    "x": 283.9583435058594,
    "y": 393.16668701171875,
    "width": 235.95834350585938,
    "height": 132.70834350585938,
    "top": 393.16668701171875,
    "right": 519.9166870117188,
    "bottom": 525.8750305175781,
    "left": 283.9583435058594
}

```

# old code
## html and javascript for testing api connection
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Movie Ratings</title>
    <script defer src="movie_ratings.js"></script>
</head>
<body>
    <h1>Movie Ratings</h1>
    <button id="fetchRatings">Get Ratings</button>
    <div id="results"></div>
</body>
</html>
```
```javascript
const apiKey = "4d0d9770";

document.getElementById("fetchRatings").addEventListener("click", async function () {
  const movieTitle = "Ghosts";
  const url = `http://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(movieTitle)}&r=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = ""; // Clear previous results

    if (data.Response === "True") {
      const imdbRating = data.Ratings.find(rating => rating.Source === "Internet Movie Database");
      const rottenTomatoesRating = data.Ratings.find(rating => rating.Source === "Rotten Tomatoes");

      resultsDiv.innerHTML = `
        <p><strong>IMDb Rating:</strong> ${imdbRating ? imdbRating.Value : "N/A"}</p>
        <p><strong>Rotten Tomatoes Rating:</strong> ${rottenTomatoesRating ? rottenTomatoesRating.Value : "N/A"}</p>
      `;
    } else {
      resultsDiv.innerHTML = "<p>Movie not found.</p>";
    }
  } catch (error) {
    console.error("Error fetching movie ratings:", error);
    document.getElementById("results").innerHTML = "<p>Error fetching ratings.</p>";
  }
});

```