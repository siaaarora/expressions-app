/* Utility function to check if the request from the frontend
    contains the required parameter fields */
const checkParams = (requiredParams, requestParams) => {
    for (const p of requiredParams) {
        if (!(p in requestParams)) {
            return false;
        }
    }
    return true;
};


/* Utility function to check if the request from the frontend
    contains the required body fields */
const checkBody = (requiredBodyFields, requestBody) => {
    for (const f of requiredBodyFields) {
        if (!(f in requestBody)) {
            return false;
        }
    }
    return true;
};


/* Returns {"correct": bool, "message": string}. "correct" is True if all params
    and body fields are present, False otherwise. "message" contains useful information
    about which input was missing fields. */
const allDataPresent = (requiredParams, requiredBodyFields, request) => {
    // requiredParams, requiredBodyFields: array
    // request: JSON object

    const paramFlag = checkParams(requiredParams, request.params);
    const bodyFlag = checkBody(requiredBodyFields, request.body);

    if (paramFlag && bodyFlag) {
        return { "correct": true, "message": "All params and body fields are present." };
    }
    if (!paramFlag) {
        console.log("Missing some parameters:\nExpected: [" + requiredParams.join(", ") +"]\nActual: [" + Object.keys(request.params).join(", ") + "]");
        return { "correct": false, "message": "Missing some parameters:\nExpected: [" + requiredParams.join(", ") +"]\nActual: [" + Object.keys(request.params).join(", ") + "]"};
    }
    if (!bodyFlag) {
        console.log("Missing some body fields:\nExpected: [" + requiredBodyFields.join(", ") +"]\nActual: [" + Object.keys(request.body).join(", ") + "]");
        return { "correct": false, "message": "Missing some body fields:\nExpected: [" + requiredBodyFields.join(", ") +"]\nActual: [" + Object.keys(request.body).join(", ") + "]"};   
    }
};

export { allDataPresent };