#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum SupportedPlatform {
    MacOs,
    Windows,
    Other,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum ActivationGesture {
    PrimaryClick,
    DoubleClick,
    ContextMenuOpen,
}

#[must_use]
pub const fn should_open(platform: SupportedPlatform, gesture: ActivationGesture) -> bool {
    matches!(gesture, ActivationGesture::ContextMenuOpen)
        || matches!(
            (platform, gesture),
            (SupportedPlatform::MacOs, ActivationGesture::PrimaryClick)
                | (SupportedPlatform::Windows, ActivationGesture::DoubleClick)
        )
}

#[must_use]
pub const fn current_platform() -> SupportedPlatform {
    if cfg!(target_os = "macos") {
        SupportedPlatform::MacOs
    } else if cfg!(target_os = "windows") {
        SupportedPlatform::Windows
    } else {
        SupportedPlatform::Other
    }
}

#[cfg(test)]
mod tests {
    use super::{ActivationGesture, SupportedPlatform, should_open};

    #[test]
    fn maps_native_gestures_and_keeps_context_menu_fallback() {
        assert!(should_open(
            SupportedPlatform::MacOs,
            ActivationGesture::PrimaryClick
        ));
        assert!(should_open(
            SupportedPlatform::Windows,
            ActivationGesture::DoubleClick
        ));
        assert!(!should_open(
            SupportedPlatform::Windows,
            ActivationGesture::PrimaryClick
        ));
        assert!(should_open(
            SupportedPlatform::Other,
            ActivationGesture::ContextMenuOpen
        ));
    }
}
