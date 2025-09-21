export class HttpError extends Error {
    constructor(public status: number, public body: unknown) {
        super(typeof body === 'string' ? body : JSON.stringify(body));
    }

    static badRequest(msg = 'bad_request') {
        return new HttpError(400, { code: 'bad_request', msg });
    }

    static unprocessable(err: any) {
        return new HttpError(422, { code: 'validation_error', errors: err });
    }

    static conflict(msg = 'conflict') {
        return new HttpError(409, { code: 'conflict', msg });
    }
}












