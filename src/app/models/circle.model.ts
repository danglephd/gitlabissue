export interface Circle {
    fontSize: any;
    R: number;
    rX: number;
    rY: number;
    value: number;
    backgroundColor: string;
    color: string;
    isActive?: boolean; // Trạng thái active (optional)
    lineHeight?: string; // Chiều cao dòng (optional)
    isHidden?: boolean; // Trạng thái ẩn (optional)
    height?: string; // Chiều cao (optional)
    width?: string; // Chiều rộng (optional)
    left?: string; // Vị trí trái (optional)
    top?: string; // Vị trí trên (optional)
    rotate?: number; // Góc quay (optional)
}