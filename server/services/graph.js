require("isomorphic-fetch");
const { GRAPH_TENANTID, GRAPH_CLIENTID, GRAPH_CLIENTSECRET, SHAREPOINT_SITEID, EMAIL } = require("../config");
const azure = require("@azure/identity");
const { Client } = require("@microsoft/microsoft-graph-client");
const {TokenCredentialAuthenticationProvider,} = require("@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials"); //prettier-ignore
const axios = require("axios");
const { response } = require("express");
const graph = (module.exports = {});

let _clientSecretCredential = undefined;
let graphClient = undefined;
let tokenInfo = {
  token: null,
  expiration: null,
};

graph.initializeGraphForAppOnlyAuth = () => {
  if (!_clientSecretCredential) {
    _clientSecretCredential = new azure.ClientSecretCredential(GRAPH_TENANTID, GRAPH_CLIENTID, GRAPH_CLIENTSECRET);
  }
  if (!graphClient) {
    const authProvider = new TokenCredentialAuthenticationProvider(_clientSecretCredential, {
      scopes: ["https://graph.microsoft.com/.default"],
    });

    graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });
  }
};

async function getAccessToken() {
  const currentTime = new Date();
  // Refresh the token if it is null or expired
  if (!tokenInfo.token || currentTime >= tokenInfo.expiration) {
    console.log(currentTime, tokenInfo.expiration); // Debugging log
    console.log("Refreshing token..."); // Debugging log
    if (!_clientSecretCredential) {
      _clientSecretCredential = new azure.ClientSecretCredential(GRAPH_TENANTID, GRAPH_CLIENTID, GRAPH_CLIENTSECRET);
    }
    let response = await _clientSecretCredential.getToken("https://graph.microsoft.com/.default");
    tokenInfo.token = response.token;
    tokenInfo.expiration = new Date(response.expiresOnTimestamp);
    console.log("Token refreshed:", tokenInfo.expiration); // Debugging log
  }
  return tokenInfo.token;
}

graph.getSites = async () => {
  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const resp = await graphClient.api("/sites").top(1).get();
    return resp;
  }
};

graph.getChildrentItems = async (parentId) => {
  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const resp = await graphClient.api(`/sites/${SHAREPOINT_SITEID}/drive/items/${parentId}/children`).get();
    return resp;
  }
};

graph.getContent = async (itemId, format) => {
  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    let endpoint = `/sites/${SHAREPOINT_SITEID}/drive/items/${itemId}/content`;
    if (format) {
      endpoint += `?format=${format}`;
    }
    const resp = await graphClient.api(endpoint).responseType("blob").get();
    return resp;
  }
};

graph.searchItems = async (query) => {
  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const resp = await graphClient.api(`/sites/${SHAREPOINT_SITEID}/drive/root/search(q='${query}')`).get();
    return resp.value;
  }
};
graph.createFolder = async (parentItemId, folderName) => {
  const driveItem = {
    name: folderName,
    folder: {},
    "@microsoft.graph.conflictBehavior": "replace",
  };

  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const resp = await graphClient.api(`/sites/${SHAREPOINT_SITEID}/drive/items/${parentItemId}/children`).post(driveItem);
    return resp;
  }
};

graph.uploadSmallFile = async (parentItemId, file) => {
  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const resp = graphClient
      .api(
        `/sites/${SHAREPOINT_SITEID}/drive/items/${parentItemId}:/${file.originalname}:/content?@microsoft.graph.conflictBehavior=rename`
      )
      .header("Content-Type", "application/octet-stream")
      .put(file.buffer);

    return resp;
  }
};

graph.uploadLargeFile = async (parentItemId, file) => {
  const requestBody = {
    item: {
      "@microsoft.graph.conflictBehavior": "rename",
      name: file.originalname,
      description: "A large file uploaded from Node.js",
    },
  };

  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  }

  // Helper function to create an upload session
  const createUploadSession = async () => {
    return await graphClient
      .api(`/sites/${SHAREPOINT_SITEID}/drive/items/${parentItemId}:/${file.originalname}:/createUploadSession`)
      .post(requestBody);
  };

  // Helper function for exponential backoff
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const uploadFileChunk = async (uploadUrl, chunk, contentLength, contentRange, retryCount = 0) => {
    try {
      await axios.put(uploadUrl, chunk, {
        headers: {
          "Content-Length": contentLength,
          "Content-Range": contentRange,
        },
      });
    } catch (error) {
      if (error.response && error.response.status >= 500 && error.response.status < 600 && retryCount < 5) {
        // 5xx server errors - retry with exponential backoff
        await sleep(Math.pow(2, retryCount) * 1000);
        await uploadFileChunk(uploadUrl, chunk, contentLength, contentRange, retryCount + 1);
      } else {
        throw error;
      }
    }
  };

  const handleUpload = async () => {
    let sessionResponse = await createUploadSession();
    let uploadUrl = sessionResponse.uploadUrl;
    const fileSize = file.size;
    const chunkSize = 320 * 1024; // 320 KiB
    let start = 0;

    while (start < fileSize) {
      const end = Math.min(start + chunkSize, fileSize) - 1;
      const chunk = file.buffer.slice(start, end + 1);

      const contentLength = end - start + 1;
      const contentRange = `bytes ${start}-${end}/${fileSize}`;

      try {
        await uploadFileChunk(uploadUrl, chunk, contentLength, contentRange);
      } catch (error) {
        if (error.response) {
          if (error.response.status === 409) {
            // Conflict error, restart upload with a new session
            sessionResponse = await createUploadSession();
            uploadUrl = sessionResponse.uploadUrl;
            start = 0;
            continue;
          } else if (error.response.status === 404) {
            // Not found error, restart upload with a new session
            sessionResponse = await createUploadSession();
            uploadUrl = sessionResponse.uploadUrl;
            start = 0;
            continue;
          }
        }
        throw error; // Rethrow if it's a different error or max retries reached
      }
      start = end + 1;
    }
  };

  try {
    await handleUpload();
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};

graph.createShareLink = async (itemId) => {
  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const permission = {
      type: "view",
      password: "ThisIsMyPrivatePassword",
      scope: "anonymous",
      retainInheritedPermissions: false,
    };

    const resp = graphClient.api(`/sites/${SHAREPOINT_SITEID}/drive/items/${itemId}/createLink`).post(permission);

    return resp;
  }
};
graph.sendEmailToUser = async (user, file) => {
  const fileAsBase64String = file.buffer.toString("base64");
  const mailItem = {
    message: {
      subject: `Your design is here!!`,
      body: {
        contentType: "HTML",
        content: `<div style="font-family: Arial, sans-serif; color: #333;">
          <b style="color: #0078D4;">Hello ${user.name}</b>
          <p>Here is your final design.</p>
        </div>`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: user.email,
          },
        },
      ],
      attachments: [
        {
          "@odata.type": "#microsoft.graph.fileAttachment",
          name: file.originalname,
          contentType: "application/pdf",
          contentBytes: fileAsBase64String,
        },
      ],
    },
    saveToSentItems: "false",
  };

  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const resp = await graphClient.api(`/users/${EMAIL}/sendMail`).post(mailItem);
    return resp;
  }
};
graph.sendEmail = async (toEmail, requestId, FriloUrl, userInputWebUrl) => {
  const mailItem = {
    message: {
      subject: `New Request is here | ${requestId}`,
      body: {
        contentType: "HTML",
        content: `<div style="font-family: Arial, sans-serif; color: #333;">
    <b style="color: #0078D4;">Hello Statiker Babos</b>
    <p>Hoorayyy!! We have received a new request <b>${requestId}</b>. Please look into the <a href="${userInputWebUrl}" style="color: #0078D4; text-decoration: none;"><b>sharepoint</b></a> folder for supporting documents of the request.</p>
    <p>Here is the <a href="${FriloUrl}" style="color: #0078D4; text-decoration: none;">Frilo</a> template which modified for the request.</p>
    <p>Click <a href="http://localhost:3000/upload-page/:${requestId}" style="color: #0078D4; text-decoration: none;">here</a> to upload the final results.</p>
    <p>Contact your manager for more information.</p>
</div>`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: toEmail,
          },
        },
      ],
    },
    saveToSentItems: "false",
  };

  if (!graphClient) {
    throw new Error("Graph has not been initialized for app-only auth");
  } else {
    const resp = await graphClient.api(`/users/${EMAIL}/sendMail`).post(mailItem);
    return resp;
  }
};
