import { environment } from '../environments/environment';

// const API_URL = process.env.VUE_APP_API_URL;
const API_URL = environment.apiEndpoint;

export default {
  async getUsers() {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  },

  async login(email, password) {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return response.json();
  },
};
