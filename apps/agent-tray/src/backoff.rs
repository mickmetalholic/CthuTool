use std::{collections::VecDeque, time::Duration};

#[derive(Clone, Debug)]
pub struct RestartPolicy {
    base_delay: Duration,
    max_delay: Duration,
    crash_window: Duration,
    max_crashes: usize,
    failures: VecDeque<Duration>,
    latched: bool,
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum RestartDecision {
    RetryAfter(Duration),
    Latched,
}

impl RestartPolicy {
    #[must_use]
    pub fn new(
        base_delay: Duration,
        max_delay: Duration,
        crash_window: Duration,
        max_crashes: usize,
    ) -> Self {
        Self {
            base_delay,
            max_delay,
            crash_window,
            max_crashes,
            failures: VecDeque::new(),
            latched: false,
        }
    }

    #[must_use]
    pub fn production() -> Self {
        Self::new(
            Duration::from_millis(500),
            Duration::from_secs(30),
            Duration::from_secs(5 * 60),
            5,
        )
    }

    pub fn record_failure(&mut self, now: Duration) -> RestartDecision {
        while self
            .failures
            .front()
            .is_some_and(|failure| now.saturating_sub(*failure) > self.crash_window)
        {
            self.failures.pop_front();
        }
        self.failures.push_back(now);
        if self.failures.len() > self.max_crashes {
            self.latched = true;
            return RestartDecision::Latched;
        }
        let exponent = u32::try_from(self.failures.len().saturating_sub(1)).unwrap_or(u32::MAX);
        let multiplier = 2_u32.checked_pow(exponent).unwrap_or(u32::MAX);
        RestartDecision::RetryAfter(
            self.base_delay
                .saturating_mul(multiplier)
                .min(self.max_delay),
        )
    }

    pub fn record_stable_run(&mut self) {
        self.failures.clear();
        self.latched = false;
    }

    #[must_use]
    pub const fn is_latched(&self) -> bool {
        self.latched
    }
}

#[cfg(test)]
mod tests {
    use super::{RestartDecision, RestartPolicy};
    use std::time::Duration;

    #[test]
    fn backs_off_exponentially_and_caps_delay() {
        let mut policy = RestartPolicy::new(
            Duration::from_secs(1),
            Duration::from_secs(4),
            Duration::from_secs(60),
            8,
        );

        assert_eq!(
            policy.record_failure(Duration::from_secs(1)),
            RestartDecision::RetryAfter(Duration::from_secs(1))
        );
        assert_eq!(
            policy.record_failure(Duration::from_secs(2)),
            RestartDecision::RetryAfter(Duration::from_secs(2))
        );
        assert_eq!(
            policy.record_failure(Duration::from_secs(3)),
            RestartDecision::RetryAfter(Duration::from_secs(4))
        );
        assert_eq!(
            policy.record_failure(Duration::from_secs(4)),
            RestartDecision::RetryAfter(Duration::from_secs(4))
        );
    }

    #[test]
    fn latches_after_crash_budget_and_resets_only_after_stability() {
        let mut policy = RestartPolicy::new(
            Duration::from_secs(1),
            Duration::from_secs(8),
            Duration::from_secs(10),
            2,
        );

        assert!(matches!(
            policy.record_failure(Duration::from_secs(1)),
            RestartDecision::RetryAfter(_)
        ));
        assert!(matches!(
            policy.record_failure(Duration::from_secs(2)),
            RestartDecision::RetryAfter(_)
        ));
        assert_eq!(
            policy.record_failure(Duration::from_secs(3)),
            RestartDecision::Latched
        );
        assert!(policy.is_latched());

        policy.record_stable_run();
        assert!(!policy.is_latched());
    }

    #[test]
    fn expires_failures_outside_crash_window() {
        let mut policy = RestartPolicy::new(
            Duration::from_secs(1),
            Duration::from_secs(8),
            Duration::from_secs(3),
            1,
        );
        let _ = policy.record_failure(Duration::from_secs(1));

        assert_eq!(
            policy.record_failure(Duration::from_secs(5)),
            RestartDecision::RetryAfter(Duration::from_secs(1))
        );
    }
}
