class ApiError extends Error {
    public statusCode: number;
    public data: any;
    public success: boolean;
    public errors: any[];

    constructor(statusCode: number, message: string = "something went wrong", errors: any[] = [], stack: string = "") {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.success = false;
        this.errors = errors;
        this.data = null;

        if (stack) {
            this.stack = stack;
        } else if (typeof Error.captureStackTrace === 'function') {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError }