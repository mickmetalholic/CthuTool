pub const ICON_SIZE: u32 = 32;

#[must_use]
pub fn tray_icon_rgba() -> Vec<u8> {
    let mut rgba = vec![0_u8; (ICON_SIZE * ICON_SIZE * 4) as usize];
    for y in 0..ICON_SIZE {
        for x in 0..ICON_SIZE {
            let center = x.abs_diff(ICON_SIZE / 2) + y.abs_diff(ICON_SIZE / 2);
            let ring = (8..=17).contains(&center);
            let stem = (14..=17).contains(&x) && (8..=24).contains(&y);
            if ring || stem {
                let offset = ((y * ICON_SIZE + x) * 4) as usize;
                rgba[offset..offset + 4].copy_from_slice(&[20, 20, 20, 255]);
            }
        }
    }
    rgba
}

#[cfg(test)]
mod tests {
    use super::{ICON_SIZE, tray_icon_rgba};

    #[test]
    fn native_icon_has_expected_rgba_dimensions() {
        assert_eq!(tray_icon_rgba().len(), (ICON_SIZE * ICON_SIZE * 4) as usize);
        assert!(
            tray_icon_rgba()
                .chunks_exact(4)
                .any(|pixel| pixel[3] == 255)
        );
    }
}
