/********************************
Filename: main.js
Author: Lien Ho Hoang
Description: javascript assignment
Date: Nov 28, 2018
*********************************/
/* globals APIKEY */

var HOHOANGLIEN = {
    movieDataBaseURL: "https://api.themoviedb.org/3/",
    imageURL: null,
    imageSizes: [],
    searchString: "",
    mode: "movie",
    staleDataTimeOut: 3600, // 1 hour

    init: function () {

        HOHOANGLIEN.getLocalStorageData();
        HOHOANGLIEN.addEventListeners();
    },

    addEventListeners: function () {

        //call startSearch if user clicks Search button
        document.querySelector(".searchButtonDiv").addEventListener("click", HOHOANGLIEN.startSearch);

        //call startSearch if user press Enter key
        document.querySelector("#search-input").addEventListener("keypress", function (e) {
            let key = e.which || e.keyCode;
            if (key === 13) { // 13 is enter
                document.querySelector("#search-input").blur();
                HOHOANGLIEN.startSearch(); // code for enter
            }
        });
        //Home button
        document.querySelector(".homeButtonDiv").addEventListener("click", function () {
            location.reload();
        });

        document.querySelector(".optionButtonDiv").addEventListener("click", function () {
            if (HOHOANGLIEN.mode == "tv") {
                document.querySelector(".searchType").type[1].checked = true;
            } else {
                document.querySelector(".searchType").type[0].checked = true;
            }
            HOHOANGLIEN.setModalDisplay("block");

        });
        //Close the modal without saving
        document.querySelector("#btnClose").addEventListener("click", function (e) {
            e.preventDefault();
            HOHOANGLIEN.setModalDisplay("none");
        });

        //Save the option in the modal
        document.querySelector("#btnSave").addEventListener("click", function (e) {
            e.preventDefault();
            HOHOANGLIEN.setModalDisplay("none");

            //save the selected option to localStorage
            HOHOANGLIEN.mode = document.querySelector(".searchType").type.value;

            if (HOHOANGLIEN.mode != localStorage.getItem("mode")) {
                localStorage.setItem("mode", HOHOANGLIEN.mode);
                if (HOHOANGLIEN.mode == "tv") {
                    document.querySelector(".txtHeader").textContent = "Television Recommendations";
                } else {
                    document.querySelector(".txtHeader").textContent = "Movie Recommendations";
                }
                if (document.getElementById("search-input").value) {
                    HOHOANGLIEN.startSearch();
                }
            }
        });
    },

    getLocalStorageData: function () {
        if (localStorage.getItem("mode")) {
            HOHOANGLIEN.mode = localStorage.getItem("mode");
        }
        // load image sizes and base url from local storage
        if (localStorage.getItem("savedTime")) {
            let savedTime = localStorage.getItem("savedTime");
            savedTime = new Date(savedTime);
            console.log(savedTime);
            let a = HOHOANGLIEN.calculateElapsedTime(savedTime);
            if (a > HOHOANGLIEN.staleDataTimeOut) {
                // doesn't exist
                // the data is there but stale (over 1 hour old)
                HOHOANGLIEN.getPosterSizesAndURL();
                console.log("get poster from URL");
                // else it does exist and is less than 1 hour old -> load from local storage
            } else {

                HOHOANGLIEN.imageURL = localStorage.getItem("imageURL");
                HOHOANGLIEN.imageSizes = localStorage.getItem("imageSizes");
            }
        } else {
            HOHOANGLIEN.getPosterSizesAndURL();
        }
        if (HOHOANGLIEN.mode == "tv") {
            document.querySelector(".txtHeader").textContent = "Television Recommendations";
        } else {
            document.querySelector(".txtHeader").textContent = "Movie Recommendations";
        }
    },

    saveDataToLocalStorage: function () {
        localStorage.setItem("imageURL", HOHOANGLIEN.imageURL);
        localStorage.setItem("imageSizes", HOHOANGLIEN.imageSizes);
        localStorage.setItem("mode", HOHOANGLIEN.mode);
        localStorage.setItem("savedTime", new Date());
    },

    getPosterSizesAndURL: function () {
        let url = `${HOHOANGLIEN.movieDataBaseURL}configuration?api_key=${APIKEY}`; //concat a string

        fetch(url)
            .then(function (response) {
                return response.json(); //converted to JSON
            })
            .then(function (data) {
                console.log(data);
                HOHOANGLIEN.imageURL = data.images.secure_base_url;
                HOHOANGLIEN.imageSizes = data.images.poster_sizes;
                HOHOANGLIEN.saveDataToLocalStorage();
            })
            .catch(function (error) {
                alert(error);
            });
    },

    // start the initial seach from the app home page
    startSearch: function () {
        console.log("start search");
        HOHOANGLIEN.searchString = document.getElementById("search-input").value;
        if (!HOHOANGLIEN.searchString) {
            alert("Please enter search data");
            document.getElementById("search-input").focus();
            return;
        }

        //reset any existing page data 
        document.querySelector("#search-results>.content").textContent = "";
        document.querySelector("#search-results>.title").textContent = "";
        document.querySelector("#recommend-results>.content").textContent = "";
        document.querySelector("#recommend-results>.title").textContent = "";
        HOHOANGLIEN.getSearchResults(HOHOANGLIEN.searchString);
    },

    // called from startSearch()
    getSearchResults: function () {
        // https://developers.themoviedb.org/3/search/search-movies  look up search movie (also TV Shows)

        let url = `${HOHOANGLIEN.movieDataBaseURL}search/${HOHOANGLIEN.mode}?api_key=${APIKEY}&query=${HOHOANGLIEN.searchString}`;
        console.log(url);
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                HOHOANGLIEN.createPage(data);
                //  navigate to "results";
                HOHOANGLIEN.navigation();
                document.querySelector("#search-results").style.display = "block";
                document.querySelector("#recommend-results").style.display = "none";
            })
            .catch(error => console.log(error));
    },

    createPage: function (data) {
        let content = document.querySelector("#search-results>.content");
        let title = document.querySelector("#search-results>.title");

        let message = document.createElement("h3");
        content.innerHTML = "";
        title.innerHTML = "";

        if (data.total_results == 0) {
            message.innerHTML = `No results found for "${HOHOANGLIEN.searchString}"`;
        } else {
            if (data.total_pages == 1) {
                message.innerHTML = `${data.total_results} from a total of ${data.total_results} for "${HOHOANGLIEN.searchString}". <br> Click on a title to get recommendations.`;
            } else {
                message.innerHTML = `Results 1-20 from a total of ${data.total_results} for "${HOHOANGLIEN.searchString}". <br> Click on a title to get recommendations.`;
            }
        }
        title.appendChild(message);

        let documentFragment = new DocumentFragment();
        documentFragment.appendChild(HOHOANGLIEN.createMovieCard(data.results));

        content.appendChild(documentFragment);

        let cardList = document.querySelectorAll(".content>div");

        cardList.forEach(function (item) {
            item.addEventListener("click", HOHOANGLIEN.getRecommendations);
        });

    },

    createMovieCard: function (results) {
        let documentFragment = new DocumentFragment(); // use a documentFragment for performancefavi

        results.forEach(function (movie) {

            let movieCard = document.createElement("div");
            let section = document.createElement("section");
            let image = document.createElement("img");
            let videoTitle = document.createElement("p");
            let videoDate = document.createElement("p");
            let videoRating = document.createElement("p");
            let videoOverview = document.createElement("p");



            // set up image source URL
            if (movie.poster_path) {
                image.src = `https://image.tmdb.org/t/p/w185${movie.poster_path}`;
            } else {
                image.src = "img/noimage.jpg";
            }

            if (HOHOANGLIEN.mode == "movie") {
                // set up the content
                videoTitle.textContent = movie.title;
                videoDate.textContent = movie.release_date;
                videoRating.textContent = `Rating: ${movie.vote_average} (${movie.vote_count})`;
                videoOverview.textContent = movie.overview;

                image.alt = movie.title;

                // set up movie data attributes
                movieCard.setAttribute("data-title", movie.title);
                movieCard.setAttribute("data-id", movie.id);
            } else if (HOHOANGLIEN.mode == "tv") {
                videoTitle.textContent = movie.name;
                videoDate.textContent = movie.first_air_date;
                videoRating.textContent = `Rating: ${movie.vote_average} (${movie.vote_count})`;
                videoOverview.textContent = movie.overview;

                image.alt = movie.name;

                // set up movie data attributes
                movieCard.setAttribute("data-title", movie.name);
                movieCard.setAttribute("data-id", movie.id);
            }


            // set up class names
            movieCard.className = "movieCard";
            section.className = "imageSection";

            // append elements
            section.appendChild(image);
            movieCard.appendChild(section);
            movieCard.appendChild(videoTitle);
            movieCard.appendChild(videoDate);
            movieCard.appendChild(videoRating);
            movieCard.appendChild(videoOverview);

            documentFragment.appendChild(movieCard);


        });
        return documentFragment;

    },

    getRecommendations: function (e) {
        console.log(this);
        console.log(e.target);
        let movieTitle = this.getAttribute("data-title");
        HOHOANGLIEN.searchString = movieTitle;
        document.getElementById("search-input").value = HOHOANGLIEN.searchString;
        let movieID = this.getAttribute("data-id");
        //        console.log("you clicked: " + movieTitle + " " + movieID);

        let url = `${HOHOANGLIEN.movieDataBaseURL}${HOHOANGLIEN.mode}/${movieID}/recommendations?api_key=${APIKEY}`;
        console.log(url);
        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log(data);

                //  create the page from data
                HOHOANGLIEN.createPageRecommendation(data);
                //  navigate to "results";
                document.querySelector("#search-results").style.display = "none";
                document.querySelector("#recommend-results").style.display = "block";
            })
            .catch(error => console.log(error));
        window.scrollTo(0, 0);

    },

    createPageRecommendation: function (data) {
        let content = document.querySelector("#recommend-results>.content");
        let title = document.querySelector("#recommend-results>.title");

        let message = document.createElement("h3");
        content.innerHTML = "";
        title.innerHTML = "";

        if (data.total_results == 0) {
            message.innerHTML = `No recommendations found for "${HOHOANGLIEN.searchString}"`;
        } else {
            if (data.total_pages == 1) {
                message.innerHTML = `${data.total_results} from a total of ${data.total_results} for "${HOHOANGLIEN.searchString}". <br> Click on a title to get recommendations.`;
            } else {
                message.innerHTML = `Recommendations 1-20 from a total of ${data.total_results} for "${HOHOANGLIEN.searchString}". <br> Click on a title to get recommendations.`;
            }
        }
        title.appendChild(message);

        let documentFragment = new DocumentFragment();
        documentFragment.appendChild(HOHOANGLIEN.createMovieCard(data.results));

        content.appendChild(documentFragment);

        let cardList = document.querySelectorAll(".content>div");

        cardList.forEach(function (item) {
            item.addEventListener("click", HOHOANGLIEN.getRecommendations);
        });

    },

    navigation: function () {
        document.getElementById("home-button").style.display = "block";

    },

    setModalDisplay: function (display) {
        document.querySelector(".overlay").style.display = display;
        document.querySelector(".modal").style.display = display;
    },

    calculateElapsedTime: function (savedTime) {
        let now = new Date(); // get the current time

        // calculate elapsed time
        let elapsedTime = now.getTime() - savedTime.getTime(); // this in milliseconds

        let seconds = Math.ceil(elapsedTime / 1000);
        //    console.log("Elapsed Time: " + seconds + " seconds");
        return seconds;
    }
}

if (document.deviceready) {
    document.addEventListener("deviceready", HOHOANGLIEN.init);
} else {
    document.addEventListener("DOMContentLoaded", HOHOANGLIEN.init);
}
