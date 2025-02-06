const apiKey = "4d0d9770"; //Free API key from ombdapi.com

let dbInstance = null;

/**
 * Opens the IndexedDB for storing movie ratings.
 * @returns {Promise} A promise that resolves to the opened IndexedDB instance.
 */
function openDB() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open("MovieRatingsDB", 1);

    // Event triggered when the database schema is being upgraded
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("ratings")) {
        db.createObjectStore("ratings", { keyPath: "title" });
      }
    };

    // Event triggered when the database is successfully opened
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = () => reject("Failed to open IndexedDB");
  });
}

/**
 * Retrieves the cached rating for a given movie title from IndexedDB.
 * @param {string} title The title of the movie.
 * @returns {Promise} A promise that resolves to the stored rating or null.
 */
async function getCachedRating(title) {
  const db = await openDB();
  return new Promise((resolve) => {
      const transaction = db.transaction("ratings", "readonly");
      const store = transaction.objectStore("ratings");
      const request = store.get(title);

      request.onsuccess = () => resolve(request.result ? request.result.ratings : null);
      request.onerror = () => resolve(null);
  });
}

/**
 * Saves a new movie rating to IndexedDB.
 * @param {string} title The title of the movie.
 * @param {Object} ratings The ratings to be stored (IMDb and Rotten Tomatoes).
 * @returns {Promise} A promise that resolves when the rating is saved.
 */
async function saveRating(title, ratings) {
  const db = await openDB();
  return new Promise((resolve) => {
      const transaction = db.transaction("ratings", "readwrite");
      const store = transaction.objectStore("ratings");
      store.put({ title, ratings });

      transaction.oncomplete = resolve;
  });
}

/**
 * Fetches movie ratings (IMDb and Rotten Tomatoes) from the OMDB API.
 * @param {string} movieTitle The title of the movie to fetch ratings for.
 * @returns {Object} An object containing the IMDb and Rotten Tomatoes ratings or "N/A" if not found.
 */
async function fetchMovieRating(movieTitle) {
    
  const url = `https://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(movieTitle)}&r=json`;

  try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.Response === "True") {
          let imdbRating = data.Ratings.find(rating => rating.Source === "Internet Movie Database")?.Value || "N/A";
          let rottenTomatoesRating = data.Ratings.find(rating => rating.Source === "Rotten Tomatoes")?.Value || "N/A";

          // Trim IMDb ratings to remove "/10" and rt ratings to remove "%"
          if (imdbRating !== "N/A") {
            imdbRating = imdbRating.split("/")[0];
          };
          if (rottenTomatoesRating !== "N/A") {
            rottenTomatoesRating = rottenTomatoesRating.split("%")[0];
          };

          return { imdb: imdbRating, rt: rottenTomatoesRating };
      }
  } catch (error) {
      console.error(`Error fetching ratings for ${movieTitle}:`, error);
  }
  
  return { imdb: "N/A", rt: "N/A" };
}

/**
 * Determines the color based on the rating value.
 * @param {string} value The rating value to check.
 * @returns {string} The color code based on the rating.
 */
function getRatingColor(value) {
  let numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) return '#d3273e'; //Red
  if (numericValue >= 80) return '#00bfb2'; //Green
  if (numericValue >= 70) return '#ffc845'; //Yellow
  return '#d3273e'; //Red
}

/**
 * Adds movie ratings to a card element and displays them.
 * @param {Element} card The DOM element representing a movie card.
 * @returns {Promise} A promise that resolves when the rating overlay is added.
 */
async function addMovieRatings(card) {

      const title = card.getAttribute('aria-label')?.trim() || card.textContent?.trim();

      if (!title) return;

      let ratings = await getCachedRating(title);

      if (!ratings) {
        console.log(`Fetching ratings for ${title}`);
        ratings = await fetchMovieRating(title);
        await saveRating(title, ratings); // Save to IndexedDB
      } else {
          console.log(`Using cached ratings for ${title}`);
      }

      // Create the rating overlay container
      const ratingOverlay = document.createElement('div');
      ratingOverlay.classList.add('rating-overlay');
      Object.assign(ratingOverlay.style, {
          position: 'absolute',
          top: '5px',
          right: '5px',
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
          width: `${card.getBoundingClientRect().width * 0.25}px`,
          minHeight: '20px', // Keeps the overlay present even when empty
          visibility: (ratings.imdb === "N/A" && ratings.rt === "N/A") ? 'hidden' : 'visible' // Hide if both are "N/A"
      });

      // Add ratings only if they exist
      if (ratings.imdb !== "N/A") {
        const imdbDiv = document.createElement('div');
        imdbDiv.textContent = `${ratings.imdb}`;
        Object.assign(imdbDiv.style, {
            fontSize: '16px',
            fontWeight: 'bold',
            color: getRatingColor(ratings.imdb * 10),
            backgroundColor: 'black',
            padding: '2px 4px',
            borderRadius: '4px',
            marginBottom: '2px'
        });
        ratingOverlay.appendChild(imdbDiv);
      }

      if (ratings.rt !== "N/A") {
        const rtDiv = document.createElement('div');
        rtDiv.textContent = `${ratings.rt}%`;
        Object.assign(rtDiv.style, {
            fontSize: '16px',
            fontWeight: 'bold',
            color: getRatingColor(ratings.rt.split("%")[0]),
            backgroundColor: 'black',
            padding: '2px 4px',
            borderRadius: '4px'
        });
        ratingOverlay.appendChild(rtDiv);
      }

      card.style.position = 'relative';
      
      card.appendChild(ratingOverlay);
}

/**
 * Checks all movie cards for ratings and adds them if missing.
 */
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

/**
 * Observes for new title card containers in the DOM and checks for new movies.
 */
function observeMovieCards() {
  const targetNode = document.querySelector('.title-card-container') || document.body; // Adjust if needed

  if (!targetNode) {
      console.warn("Target container not found, retrying...");
      setTimeout(observeMovieCards, 1000);
      return;
  }

  let timeout;
  const observer = new MutationObserver(() => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
          checkForNewMovies();
      }, 300); // Adjust debounce time as needed
  });

  observer.observe(targetNode, { childList: true, subtree: true });
}

observeMovieCards();