export async function GET() { 
    if (!process.env.QA_OBS_ALLOW_ERROR_BURST) {
        return new Response(JSON.stringify({ok: true}), {status: 200}); 
    }
    return new Response(JSON.stringify({code: 'forced_error'}), {
        status: 500,
        headers: {'content-type': 'application/json'}
    }); 
}