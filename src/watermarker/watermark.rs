use crate::text_helper::{blend, layout_glyphs, measure_line};
use color_eyre::Result;
use conv::ValueInto;
use image::{Pixel, Rgba, RgbaImage};
use imageproc::{definitions::Clamp, drawing::Canvas};
use nalgebra::{Rotation2, Vector2};
use rusttype::{Font, Scale};
use std::f32::consts::PI;

pub fn watermark_image(source: RgbaImage, lines: Vec<String>) -> Result<RgbaImage> {
    let mut image = source.clone();
    let font_bytes = include_bytes!("../SourceCodePro-Regular.ttf");
    let font = Font::try_from_bytes(font_bytes).expect("Unable to read font");

    let smallest_dimension = f32::min(source.width() as f32, source.height() as f32);

    let font_size = f32::max((smallest_dimension * 0.04) as f32, 25.0);

    let scale = Scale {
        x: font_size,
        y: font_size,
    };

    let mut y = 0;

    let vertical_padding = 10;
    let horizontal_padding = 20;

    let rotation_matrix = Rotation2::new(-PI / 4.0);

    let number_of_lines = lines.len();
    let mut lines_index = 0;

    // used for offsetting the text every other line
    let mut even = false;

    let source_diagonal =
        f64::sqrt((source.width() as f64).powi(2) + (source.height() as f64).powi(2)) as i32;

    while y < source_diagonal {
        let text_spacing =
            measure_line(&font, &lines[lines_index], scale) as i32 + horizontal_padding;
        let mut x = 0 - even as i32 * text_spacing / 2;

        while x < source_diagonal + text_spacing as i32 {
            draw_text_mut_own(
                &mut image,
                Rgba([0, 0, 0, 50]),
                x as i32,
                y as i32,
                scale,
                &font,
                &lines[lines_index],
                rotation_matrix,
            );
            x += text_spacing;
        }
        even = !even;
        lines_index += 1;
        if lines_index == number_of_lines {
            lines_index = 0;
        }

        y += (font_size as i32) + vertical_padding;
    }
    // timer.end("Watermarking");

    Ok(image)
}

/// Implementing own text rendering
pub fn draw_text_mut_own<'a, C>(
    canvas: &'a mut C,
    color: C::Pixel,
    x: i32,
    y: i32,
    scale: Scale,
    font: &'a Font<'a>,
    text: &'a str,
    rotation_matrix: Rotation2<f32>,
) where
    C: Canvas,
    <C::Pixel as Pixel>::Subpixel: ValueInto<f32> + Clamp<f32>,
    <C as Canvas>::Pixel: Pixel,
{
    let image_width = canvas.width() as i32;
    let image_height = canvas.height() as i32;

    let offset = f32::sqrt((image_height * image_width) as f32);
    let offset_point = Vector2::new(-offset / 1.80, 0.0);

    layout_glyphs(scale, font, text, |g, bb| {
        g.draw(|gx, gy, gv| {
            let gx = gx as i32 + bb.min.x;
            let gy = gy as i32 + bb.min.y;

            let pre_image_x = gx + x;
            let pre_image_y = gy + y;

            let point = Vector2::new(pre_image_x as f32, pre_image_y as f32);

            let rotated = rotation_matrix * (point + offset_point);

            let image_x = rotated.x as i32;
            let image_y = rotated.y as i32;

            if (0..image_width).contains(&image_x) && (0..image_height).contains(&image_y) {
                let pixel = canvas.get_pixel(image_x as u32, image_y as u32);
                let weighted_color = blend(pixel, color, gv);
                canvas.draw_pixel(image_x as u32, image_y as u32, weighted_color);
            }
        })
    });
}
