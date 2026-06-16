class ApiResponse<T> {
    public statusCode: number;
    public items: T;
    public message: string;
    public sucess: boolean;

    constructor(statusCode: number, data: T, message: string = "Success") {
        this.statusCode = statusCode
        this.items = data
        this.message = message
        this.sucess = statusCode < 400
    }
}

export { ApiResponse }

