import { Issue } from '../issue';

/**
 * Cập nhật giá trị Google Drive cho các issue dựa trên project.
 * @param data Danh sách các issue cần cập nhật.
 * @returns Danh sách các issue đã được cập nhật.
 */
export function updateGDriveValue(data: Issue[]): Issue[] {
  data.forEach(element => {
    switch (element.project) {
      case "xm-web":
        element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1-4LxFb0nZ7TPGa4XO5db2xE7_fB2D_pQ";
        element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/1-3f4fI891vqfITEOP0seIKp0dZfzIfrM";
        break;
      case "xm-api":
        element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1B84We-1nziArtSClXv79tPAxOGaCg_6y";
        element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/1-j4cjtVnCYhStgR_bcLu1CDi5fbewhEC";
        break;
      case "erp-web":
        element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1-pCA_yrx3AMqe0uvazAOUBqX4mt_eGJa";
        element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/15aNUv7XJeuS755wE6t5lkJ0ZX4X-uTo8";
        break;
      case "erp-web-demo":
        element.proj_url_company = "https://drive.google.com/drive/u/1/folders/10xTCk6P5P36p47YiAQ6roLpvlbOyp6g8";
        element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/1ZGAIUvwLKKujLeetQXWvCTxwAxMaIm8y";
        break;
      case "erp-server":
        element.proj_url_company = "https://drive.google.com/drive/u/1/folders/1AohlxBRxuybnV3bVt5u4ycRFbYnQmzd7";
        element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/13gh2XVoqhKoXPFPnvaLLFRrzigdCYRBr";
        break;
      case "xm-la":
        element.proj_url_company = "https://drive.google.com/drive/u/1/folders/15nqElvThvemMUVswbH_vbchD_A8DY8LR";
        element.proj_url_mypc = "https://drive.google.com/drive/u/1/folders/1hMYaBkEtfJ1eUz0sAn5x3UHlC3jj38YA";
        break;
      default:
        element.proj_url_company = "https://null";
        element.proj_url_mypc = "https://nan";
        break;
    }
  });
  return data;
}