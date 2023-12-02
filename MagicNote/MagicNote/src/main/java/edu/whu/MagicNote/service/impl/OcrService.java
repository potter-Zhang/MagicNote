package edu.whu.MagicNote.service.impl;

import edu.whu.MagicNote.exception.TodoException;
import lombok.AllArgsConstructor;
import lombok.Cleanup;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

@Service
@AllArgsConstructor
public class OcrService {
    @Autowired
    private final Tesseract tesseract;
    /**
     * 识别图片中的文字
     * @param imageFile 图片文件
     * @return 文字信息
     */
    public String recognizeImg(MultipartFile imageFile) throws TodoException {
        String result;
        try {
            // 将图片转变为字节流
            @Cleanup
            InputStream sbs = new ByteArrayInputStream(imageFile.getBytes());
            BufferedImage bufferedImage = ImageIO.read(sbs);
            // 对图片进行文字识别
            result = tesseract.doOCR(bufferedImage);
            result = result.replaceAll(" +","");     // 将所有空格替换为空字符串，一是规范化数据，二是方便之后的根据图片中信息进行笔记搜索
        } catch (IOException e) {
            throw new TodoException(TodoException.OCR_ERROR, "图片转换失败");
        } catch (TesseractException e) {
            throw new TodoException(TodoException.OCR_ERROR, "图片识别失败");
        }
        return result;
    }

    public String recognizePdf(MultipartFile pdfFile) throws TodoException {

        PDDocument doc = null;
        StringBuilder result;
        try {
            //加载PDF文件
            @Cleanup
            InputStream sbs = pdfFile.getInputStream();
            doc = PDDocument.load(sbs);
            PDFRenderer renderer = new PDFRenderer(doc);
            //获取PDF文档的页数
            int pageCount = doc.getNumberOfPages();
            result = new StringBuilder("文档一共" + pageCount + "页" + "\n");
            for (int i = 0; i < pageCount; i++) {
                //每一页通过分辨率和颜色值进行转化并识别
                BufferedImage bufferedImage = renderer.renderImageWithDPI(i, 96 * 2, ImageType.RGB);
                result.append(tesseract.doOCR(bufferedImage));
            }
        } catch (IOException e) {
            throw new TodoException(TodoException.OCR_ERROR,"文件转换失败");
        } catch (TesseractException e) {
            throw new TodoException(TodoException.OCR_ERROR,"图片识别失败");
        } finally {
            try {
                if (doc != null) {
                    doc.close();
                }
            } catch (IOException e) {
                throw new TodoException(TodoException.OCR_ERROR,"文档关闭失败");
            }
        }
        String resultStr = result.toString();
        resultStr = resultStr.replaceAll(" +","");
        return result.toString();
    }

    public String recognizePPT(MultipartFile pptFile) throws TodoException {
        String result = new String();
        try {
            // 加载ppt文件
            @Cleanup
            InputStream sbs = pptFile.getInputStream();
            XMLSlideShow ppt = new XMLSlideShow(sbs);
            List<XSLFSlide> slides = ppt.getSlides();
            // 提取文字
            for (XSLFSlide slide : slides) {
                List<XSLFShape> shapes = slide.getShapes();
                for (XSLFShape shape : shapes) {
                    // 检查是否文字
                    if (shape instanceof XSLFTextShape) {
                        XSLFTextShape textShape = (XSLFTextShape) shape;
                        String text = textShape.getText();
                        result+= text+"\n";
                    }
                }
            }
            // 关闭文件
            ppt.close();
        } catch (IOException e) {
            throw new TodoException(TodoException.OCR_ERROR,"ppt提取文字失败");
        }
        result = result.replaceAll(" +","");
        return result;
    }
}

