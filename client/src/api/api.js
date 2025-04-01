import axios from "axios";

export function registerUser(values) {
  return axios
    .post("/api/register", values)
    .then((response) => {
      if (response.data.auth) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.error);
      }
    })
    .catch((error) => {
      console.error("Error during registration: ", error.message);
      throw error;
    });
}

export function loginUser(values) {
  return axios
    .post("/api/login", values)
    .then((response) => {
      if (response.status === 200) {
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data.error);
      }
    })
    .catch((error) => {
      console.error("Error during login: ", error.message);
      if (error.response.status === 404) {
        throw new Error("No account found");
      } else if (error.response.status === 401) {
        throw new Error("Doesn't match");
      } else {
        throw error;
      }
    });
}

// export function submitB5SingleLoad(finalFormData) {
//   return axios
//     .post("/api/b5", finalFormData, { responseType: "blob" })
//     .then((response) => {
//       const contentDisposition = response.headers["content-disposition"];
//       let filename = "results.txt"; // Default filename
//       if (contentDisposition) {
//         const filenameMatch = contentDisposition.match(/filename=(.+)/);
//         if (filenameMatch && filenameMatch.length === 2) {
//           filename = filenameMatch[1];
//         }
//       }
//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = filename;
//       a.click();
//       return { success: true, filename };
//     })
//     .catch((error) => {
//       console.error("Error during B5 single load submission: ", error.message);
//       throw error;
//     });
// }

export async function sendRequest(module, email) {
  try {
    const response = await axios.post("/api/requests", { module, email });
    return response;
  } catch (error) {
    console.error("Error sending request: ", error.message);
    throw error;
  }
}

export async function submitWo(formData) {
  try {
    const response = await axios.post("/api/wo", formData, { responseType: "blob", observe: "response" }); // Ensure the response is treated as a Blob

    // Attempt to extract filename from Content-Disposition header
    const contentDisposition = response.headers["content-disposition"];
    let filename = "User Entered Data.pdf";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1].replace(/['"]/g, "");
      }
    }

    const fileURL = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));

    const fileLink = document.createElement("a");
    fileLink.href = fileURL;
    fileLink.setAttribute("download", filename);
    document.body.appendChild(fileLink);

    fileLink.click();

    window.URL.revokeObjectURL(fileURL);
    document.body.removeChild(fileLink);

    return { success: true, status: 200 };
  } catch (error) {
    console.error("Error submitting request: ", error.message);
    throw error;
  }
}

export async function uploadAndEmail(formData) {
  try {
    const response = await axios.post("/api/upload", formData);
    return response;
  } catch (error) {
    console.error("Error uploading final file: ", error.message);
    throw error;
  }
}
