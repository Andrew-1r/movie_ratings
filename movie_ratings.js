const apiKey = "4d0d9770";

const processedMovies = new Map();

let count = 0

// Get ratings from API
async function fetchMovieRating(movieTitle) {
  count += 1;
  console.log("FETCH MOVIE RATINGS", count)
  if (count > 15) return { imdb: "69", rt: "69" };
    
    const url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(movieTitle)}&r=json`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.Response === "True") {
            let imdbRating = data.Ratings.find(rating => rating.Source === "Internet Movie Database")?.Value || "N/A";
            let rottenTomatoesRating = data.Ratings.find(rating => rating.Source === "Rotten Tomatoes")?.Value || "N/A";
            
              // Remove "/10" from IMDb rating
              if (imdbRating !== "N/A") {
                imdbRating = imdbRating.split("/")[0]; // Keeps only the numeric part
              }

            return { imdb: imdbRating, rt: rottenTomatoesRating };
        }
    } catch (error) {
        console.error(`Error fetching ratings for ${movieTitle}:`, error);
    }
    
    return { imdb: "na", rt: "na" };
}

// Request title ratings, display them on screen, add them to cards
async function addMovieRatings(card) {

      const title = card.getAttribute('aria-label')?.trim() || card.textContent?.trim();

      if (!title) return;

      let ratings;

      // Check if the movie has already been processed, else fetch ratings
      if (processedMovies.has(title)) {
        console.log(`Using cached ratings for ${title}`);
        ratings = processedMovies.get(title);
      } else {
        console.log(`Fetching ratings for ${title}`);
        ratings = await fetchMovieRating(title);
        processedMovies.set(title, ratings);
      }

      // Create the rating overlay container
      const ratingOverlay = document.createElement('div');
      ratingOverlay.classList.add('rating-overlay');
      Object.assign(ratingOverlay.style, {
          position: 'absolute',
          top: '5px',
          right: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '4px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: '1000',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          width: `${card.getBoundingClientRect().width * 0.25}px`
      });

      // Add ratings to overlay
      ratingOverlay.innerHTML = `
          <div>IMDB: ${ratings.imdb}</div>
          <div>RT: ${ratings.rt}</div>
      `;

      card.style.position = 'relative';
      
      card.appendChild(ratingOverlay);
}

function checkForNewMovies() {
  document.querySelectorAll('.title-card').forEach(card => {
      const title = card.getAttribute('aria-label')?.trim() || card.textContent?.trim();

      if (!title) return;

      //TODO add filters for games and other streaming service quirks (disney having extra stuff)

      if (!card.querySelector('.rating-overlay')) {
          addMovieRatings(card);
      }
  });
}


setInterval(checkForNewMovies, 3500);