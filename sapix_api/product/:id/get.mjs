export default function anything(response, request, query, params, body) {
    response.sendJSON({query, params, body})
}
