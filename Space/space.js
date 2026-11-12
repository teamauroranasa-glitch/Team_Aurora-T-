(() => {
  const bookDialog = document.querySelector("#book-dialog");
  const dialogTitle = document.querySelector("#book-dialog-title");
  const dialogDescription = document.querySelector("#book-dialog-description");
  const welcomeDialog = document.querySelector("#guide-welcome");
  const welcomeMessage = document.querySelector("#guide-welcome-message");
  const libraryEntry = document.querySelector("#library-entry");
  const bookHotspots = document.querySelector(".library-books");
  const libraryImage = new Image();
  libraryImage.src = "./space_images/bg.png";
  const visitorName = sessionStorage.getItem("museumVisitorName") || "Explorer";
  welcomeMessage.textContent = `Hi, ${visitorName} and Marry, welcome to the Museum of the Abandoned. I'm your guide Dr. Fredrick. Today, we are gonna have a nice time together. Before we go, first choose a book to dive into the depth.`;
  setTimeout(() => welcomeDialog.showModal(), 2000);

  function positionBookHotspots() {
    if (!libraryImage.naturalWidth || !libraryEntry || !bookHotspots) return;

    const { width, height } = libraryEntry.getBoundingClientRect();
    const isMobile = matchMedia("(max-width: 760px), (max-aspect-ratio: 4/3)").matches;
    const scaleX = width / libraryImage.naturalWidth;
    const scaleY = height / libraryImage.naturalHeight;
    const scale = isMobile ? Math.min(scaleX, scaleY) : Math.max(scaleX, scaleY);
    const renderedWidth = libraryImage.naturalWidth * scale;
    const renderedHeight = libraryImage.naturalHeight * scale;

    bookHotspots.style.left = `${(width - renderedWidth) / 2}px`;
    bookHotspots.style.top = `${height - renderedHeight}px`;
    bookHotspots.style.width = `${renderedWidth}px`;
    bookHotspots.style.height = `${renderedHeight}px`;
  }

  const collections = {
    MARS: {
      title: "Mars Missions",
      description: "Mars is a cold desert world with a long history of robotic exploration. No verified abandoned-hardware records are loaded yet."
    },
    SPACE: {
      title: "Deep Space Missions",
      description: "Explore the stories of spacecraft and missions that expanded humanity's knowledge beyond Earth."
    }
  };

  document.querySelectorAll("[data-library-destination]").forEach(button => {
    button.addEventListener("click", () => {
      const destination = button.dataset.libraryDestination;
      if (destination === "MOON") {
        window.location.href = "../Moon/moon.html";
        return;
      }
      if (destination === "MARS") {
        window.location.href = "../Mars/mars.html";
        return;
      }
      if (destination === "SPACE") {
        window.location.href = "../DeepSpace/deepspace.html";
        return;
      }

      const collection = collections[destination];
      if (!collection) {
        throw new Error(`Unknown mission collection: ${destination}`);
      }

      dialogTitle.textContent = collection.title;
      dialogDescription.textContent = collection.description;
      bookDialog.showModal();
    });
  });

  libraryImage.addEventListener("load", positionBookHotspots);
  new ResizeObserver(positionBookHotspots).observe(libraryEntry);
  addEventListener("resize", positionBookHotspots);
})();
