import Utils from "./utils.js";
import NotesApi from "./notes-api.js";

class NotesComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.notes = [];
    this.loadNotes();
    this.setupFormListener();
  }

  async loadNotes() {
    try {
      this.notes = await NotesApi.searchComponent("");
      this.renderNotes();
    } catch (error) {
      console.error("Failed to load notes:", error);
    }
  }

  renderNotes() {
    this.notes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const notesContainer = document.createElement("div");
    notesContainer.id = "notes-container";

    this.notes.forEach((note) => {
      const noteElement = document.createElement("div");
      noteElement.innerHTML = `
            <div class="note-content">
                <h2>${note.title}</h2>
                <p>${note.body}</p>
                <p>Created at: ${note.createdAt}</p>
                <p>Archived: ${note.archived}</p> 
            </div>
        `;
      notesContainer.appendChild(noteElement);
    });

    const style = document.createElement("style");
    style.textContent = `
          #notes-container {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 20px;
              padding: 20px;
              justify-content: space-between;
          }
          
          .note-content{
              background-color: #1976d2;
              color: rgb(206, 199, 247);
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              padding: 20px;
              box-sizing: border-box;
          }
      `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(notesContainer);
  }

  setupFormListener() {
    document.addEventListener("newNoteAdded", async (event) => {
      const { title, body } = event.detail;
      try {
        await NotesApi.addNote(title, body);
        this.loadNotes();
      } catch (error) {
        console.error("Failed to add note:", error);
      }
    });
  }
}

class SearchComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.renderSearchBar();
    this.setupSearchListener();
    this.addStyles();
  }

  renderSearchBar() {
    const searchBar = document.createElement("div");
    searchBar.innerHTML = `
          <div id="search-container">
            <input type="text" id="searchInput" placeholder="Search notes...">
            <button id="okButton">OK</button>
          </div>
        `;

    this.shadowRoot.appendChild(searchBar);
  }

  async setupSearchListener() {
    const searchInput = this.shadowRoot.getElementById("searchInput");
    const okButton = this.shadowRoot.getElementById("okButton");

    const searchHandler = async () => {
      const searchTerm = searchInput.value.toLowerCase();
      try {
        const notes = await NotesApi.searchComponent(searchTerm);
        this.renderNotes(notes);
      } catch (error) {
        console.error("Failed to fetch notes:", error);
      }
    };

    okButton.addEventListener("click", searchHandler);
    searchInput.addEventListener("input", searchHandler);
  }

  renderNotes(notes) {
    const notesContainer = this.closest("notes-component").shadowRoot.getElementById("notes-container");
    notesContainer.innerHTML = "";

    notes.forEach((note) => {
      const noteElement = document.createElement("div");
      noteElement.classList.add("note-content");
      noteElement.innerHTML = `
            <h2>${note.title}</h2>
            <p>${note.body}</p>
            <p>Created at: ${note.createdAt}</p>
            <p>Archived: ${note.archived}</p> 
        `;
      notesContainer.appendChild(noteElement);
    });
  }

  addStyles() {
    const style = document.createElement("style");
    style.textContent = `
                #search-container {
                    display: flex;
                    align-items: center;
                }
    
                #searchInput {
                    width: 30%;
                    padding: 15px;
                    border: 1px solid #ccc;
                    border-radius: 5px;
                    font-size: 16px;
                    box-sizing: border-box;
                    margin-right: 10px;
                }
    
                #okButton {
                    padding: 15px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                }
    
                #okButton:hover {
                    background-color: #0056b3;
                }
    
                #okButton:focus {
                    outline: none;
                }
            `;

    this.shadowRoot.appendChild(style);
  }
}

customElements.define("notes-component", NotesComponent);
customElements.define("search-component", SearchComponent);

const home = () => {
  const searchFormElement = document.querySelector("search-component");

  const noteListContainerElement = document.querySelector("#noteListContainer");
  const noteQueryWaitingElement = noteListContainerElement.querySelector(".query-waiting");
  const noteLoadingElement = noteListContainerElement.querySelector(".search-loading");
  const noteSearchErrorElement = noteListContainerElement.querySelector("note-search-error");
  const noteListElement = noteListContainerElement.querySelector("note-list");

  const showNoteListContainer = () => {
    Array.from(noteListContainerElement.children).forEach((element) => {
      Utils.hideElement(element);
    });
    Utils.showElement(noteListElement);
  };

  const showNoteListElements = () => {
    Array.from(noteListContainerElement.children).forEach((element) => {
      Utils.hideElement(element);
    });
    Utils.showElement(noteLoadingElement);
  };

  const showNoteList = async (query) => {
    showNoteListElements();

    try {
      const result = await NotesApi.searchComponent(query);
      displayResult(result);

      showNoteListContainer();
    } catch (error) {
      noteSearchErrorElement.textContent = error.message;
      showSearchError();
    }
  };

  const onSearchHandler = (event) => {
    event.preventDefault();

    const { query } = event.detail;
    showNoteList(query);
  };

  const displayResult = (notes) => {
    const noteItemElements = notes.map((note) => {
      const noteItemElement = document.createElement("note-item");
      noteItemElement.note = note;

      return noteItemElement;
    });

    Utils.emptyElement(noteListElement);
    noteListElement.append(...noteItemElements);
  };

  const showLoading = () => {
    Array.from(noteListContainerElement.children).forEach((element) => {
      Utils.hideElement(element);
    });
    Utils.showElement(noteLoadingElement);
  };

  const showQueryWaiting = () => {
    Array.from(noteListContainerElement.children).forEach((element) => {
      Utils.hideElement(element);
    });
    Utils.showElement(noteQueryWaitingElement);
  };

  const showSearchError = () => {
    Array.from(noteListContainerElement.children).forEach((element) => {
      Utils.hideElement(element);
    });
    Utils.showElement(noteSearchErrorElement);
  };

  searchFormElement.addEventListener("search", onSearchHandler);
  showQueryWaiting();
};

export default home;

document.addEventListener("DOMContentLoaded", () => {
  home();
});
