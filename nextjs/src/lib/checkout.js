const buildThrows = () => {
  const throws = [];

  for (let i = 1; i <= 20; i += 1) {
    throws.push({ label: `S${i}`, value: i, isDouble: false });
  }

  for (let i = 1; i <= 20; i += 1) {
    throws.push({ label: `D${i}`, value: i * 2, isDouble: true });
  }

  for (let i = 1; i <= 20; i += 1) {
    throws.push({ label: `T${i}`, value: i * 3, isDouble: false });
  }

  throws.push({ label: "Bull", value: 25, isDouble: false });
  throws.push({ label: "DBull", value: 50, isDouble: true });

  return throws;
};

const THROWS = buildThrows().sort((a, b) => b.value - a.value);
const FINISH_THROWS = THROWS.filter((throwOption) => throwOption.isDouble);

const findCheckout = (score) => {
  if (score < 2 || score > 170) return null;

  for (const last of FINISH_THROWS) {
    if (last.value === score) {
      return { method: last.label, darts: 1, score };
    }
  }

  for (const first of THROWS) {
    for (const last of FINISH_THROWS) {
      if (first.value + last.value === score) {
        return { method: `${first.label} ${last.label}`, darts: 2, score };
      }
    }
  }

  for (const first of THROWS) {
    for (const second of THROWS) {
      const remain = score - first.value - second.value;
      if (remain < 2) continue;
      const last = FINISH_THROWS.find((throwOption) => throwOption.value === remain);
      if (last) {
        return {
          method: `${first.label} ${second.label} ${last.label}`,
          darts: 3,
          score,
        };
      }
    }
  }

  return null;
};

const findBestLeave = (score) => {
  if (score <= 2) return null;
  let bestLeave = null;
  let bestGap = Number.POSITIVE_INFINITY;

  for (let leave = 170; leave >= 2; leave -= 1) {
    if (leave >= score) continue;
    const checkout = findCheckout(leave);
    if (!checkout) continue;

    const gap = score - leave;
    if (gap <= 180 && gap < bestGap) {
      bestLeave = leave;
      bestGap = gap;
    }
  }

  if (bestLeave) return bestLeave;

  for (let leave = 170; leave >= 2; leave -= 1) {
    if (leave >= score) continue;
    const checkout = findCheckout(leave);
    if (checkout) return leave;
  }

  return null;
};

export const calculateCheckout = (score) => {
  if (!score || score < 2) return null;

  const checkout = findCheckout(score);
  if (checkout) return checkout;

  const leave = findBestLeave(score);
  if (leave) {
    const leaveCheckout = findCheckout(leave);
    return {
      method: `Leave ${leave} (${leaveCheckout?.method || "checkout"})`,
      darts: 3,
      score,
    };
  }

  return {
    method: "Setup for checkout",
    darts: 3,
    score,
  };
};
