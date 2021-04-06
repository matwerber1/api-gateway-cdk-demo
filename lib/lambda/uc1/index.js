exports.handler = async (event, context) => {

    console.log('Received event:', JSON.stringify(event, null, 2));

    let body = {
        "derp": "cats"
    };

    let statusCode = '200';
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    body = JSON.stringify(body);

    var response = {
        statusCode,
        body,
        headers,
    };

    console.log('Response to API Gateway:', JSON.stringify(response, null, 2));

    return response;
};
