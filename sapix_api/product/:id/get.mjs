export default function anything(response, query, params, body) {
    response.sendJSON({query, params, body})
}
