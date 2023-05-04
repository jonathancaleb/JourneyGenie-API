/**
 *
 * @param {*} data
 * @returns JSON object if data is a valid JSON string
 * @returns null if data is not a valid JSON string - plain string
 * @returns data if data is of any other type
 * @returns error if there is an error while parsing the JSON string
 */
function toJSON(data) {
    try {
        return JSON.parse(data);
    } catch (error) {
        if (error instanceof SyntaxError) {
            return null;
        }
        return error;
    }
}

function stringify (data) {
    try {
        const res = JSON.stringify(data);
        return res;
    } catch (error) {
        return error;
    }
}

module.exports = {
    toJSON,
    stringify
}
