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
