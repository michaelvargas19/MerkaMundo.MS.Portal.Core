export class ResponseDTO<T> {
    public Code: number | null = null;
    public Message: string | null = null;
    public Data: T | null = null;
    public Count: number | null = null;
    public ProcessTimeSeg: number | null = null;

}