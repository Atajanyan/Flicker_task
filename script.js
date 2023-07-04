

const API_KEY = '432038f9a2f76cf4ff57cc1e679c08c6';
let page = 5;
let form = document.querySelector("form");
let input = document.querySelector("input");
let img_container = document.querySelector(".img-container");
let baskets = document.querySelector(".baskets");
let button = document.querySelector("button");

let currentItem = {};

form.addEventListener("submit", search);

function dragStartHandler(e, item) {
  e.target.classList.add("img-container__img--opacity");
  currentItem = { e, item };
}

function dragEndHandler(e) {
  e.target.classList.remove("basket--shadow");
  e.target.classList.remove("img-container__img--opacity");
}

function dragEnterHandler(e) {
  e.preventDefault();
  if (e.target.className === "basket") {
    e.target.classList.add("basket--shadow");
  }
}

function dragLeaveHandler(e) {
  e.preventDefault();
  e.target.classList.remove("basket--shadow");
}

function dropHandler(e, elem) {
  e.preventDefault();
  e.target.classList.remove("basket--shadow");

  if (e.target.textContent === currentItem.item.name) {
    e.target.classList.remove("basket--shadow");

    let dragImg = document.createElement("img");
    dragImg.src = currentItem.item.url;
    dragImg.draggable = false;

    if (dragImg.src === currentItem.e.target.src) {
      currentItem.e.target.classList.add('img-container__img--none');
    }

    dragImg.className = "img-container__img";
    elem.append(dragImg);
  }

  let sort = [...img_container.children].every((el) => [...el.classList].includes('img-container__img--none'));

  if (sort) {
    img_container.textContent = 'All photos sorted';
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.onload = function () {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.response));
      } else {
        reject(new Error('Request failed'));
      }
    };
    xhr.onerror = function () {
      reject(new Error('Request failed'));
    };
    xhr.send();
  });
}

function search(e) {
  e.preventDefault();

  input.focus();

  button.disabled = true;

  let tags = input.value.split(" ").filter((e, index, arr) => {
    return e.trim().length > 0 && arr.indexOf(e.trim()) === index;
  });

  input.value = tags.join(" ");
  img_container.innerHTML = "";
  baskets.innerHTML = ""

  let requests = tags.map((tag) => {
    return makeRequest(
      `https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${API_KEY}&tags=${tag}&per_page=${page}&page=1&format=json&nojsoncallback=1`
    );
  });

  let responses = [];


  function processResponse(response, index) {

    responses.push(response.photos?.photo?.map((img) => {
      return {
        id: img.id + Math.random(),
        title: img.title,
        url: `https://live.staticflickr.com/${img.server}/${img.id}_${img.secret}.jpg`,
        name: response.name,
      };
    }));


    if (!response.photos.photo.length && responses.length < 2) {
      img_container.textContent = 'No Search Result';
    }

    response.name = tags[index];

    if (response.photos.photo.length) {
      img_container.textContent = ''
      let basketContainer = document.createElement("div");
      basketContainer.className = "basketContainer";

      let basket = document.createElement("div");
      basket.className = "basket";
      basket.textContent = tags[index];

      let basketImages = document.createElement("div");
      basketImages.className = "basketImages";

      basketContainer.append(basket, basketImages);
      baskets.append(basketContainer);

      basket.ondragleave = (e) => {dragLeaveHandler(e)};
      basket.ondragend = (e) => {dragEndHandler(e)};
      basket.ondragenter = (e) => {dragEnterHandler(e)};
      basket.ondragover = (e) => {e.preventDefault()};
      basket.ondrop = (e) => {dropHandler(e, basketImages)};

      basket.addEventListener("click", (e) => {
        e.stopPropagation();
        basketImages.classList.toggle("basketImages--hide");
      });
    }


    if (responses.length === tags.length) {
      const flatResponses = responses.flat().sort(() => Math.random() - 0.5);

      flatResponses.forEach((elem) => {
        let img = document.createElement("img");
        img.className = "img-container__img";
        img.src = elem.url;
        img.draggable = "true";
        img.ondragstart = (e) => dragStartHandler(e, elem);
        img.ondragend = (e) => dragEndHandler(e);
        img_container.append(img);
      });
    }
  }


  function handleRequest(index) {
    if (index >= requests.length) {
      button.disabled = false;
      return;
    }

    const request = requests[index];
    request
      .then((response) => {
        processResponse(response, index);
        handleRequest(index + 1);
      })
      .catch((error) => {
        console.log('Request failed:', error);
        handleRequest(index + 1);
      });
  }

  handleRequest(0);
}
