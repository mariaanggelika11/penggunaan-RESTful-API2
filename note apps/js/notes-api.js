const BASE_URL = "https://notes-api.dicoding.dev/v2";

class NotesApi {
  static searchComponent(query) {
    return fetch(`${BASE_URL}/component/search?t=${query}`)
      .then((response) => {
        if (response.status >= 200 && response.status < 300) {
          return response.json();
        } else {
          throw new Error(`Something went wrong`);
        }
      })
      .then((responseJson) => {
        const { search: notes } = responseJson;

        if (notes.length > 0) {
          return Promise.resolve(notes);
        } else {
          throw new Error(`\`${query}\` is not found`);
        }
      })
      .catch((error) => {
        throw new Error(error.message);
      });
  }
}

export default NotesApi;
