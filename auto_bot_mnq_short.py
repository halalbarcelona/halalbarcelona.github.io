import threading
import time
from ibapi.client import EClient
from ibapi.wrapper import EWrapper
from ibapi.contract import Contract
from ibapi.order import Order


class LiveBotShort(EWrapper, EClient):
    def __init__(self):
        EClient.__init__(self, self)
        self.bars5 = []
        self.bars4h = []
        self.done5 = False
        self.done4h = False
        self.next_id = None
        self.in_trade = False

    def nextValidId(self, orderId):
        self.next_id = orderId

    def historicalData(self, reqId, bar):
        if reqId == 1:
            self.bars5.append(bar)
        elif reqId == 2:
            self.bars4h.append(bar)

    def historicalDataEnd(self, reqId, start, end):
        if reqId == 1:
            self.done5 = True
        elif reqId == 2:
            self.done4h = True


# ---------- killzones (Spain time) — sirf NY AM aur NY PM ----------
KILLZONES = {
    "NY_AM":   (15 * 60 + 30,    18 * 60),
    "NY_PM":   (19 * 60 + 30,    22 * 60),
}


def bar_minutes(bar):
    t = bar.date.split()[1]
    h, m, _ = t.split(":")
    return int(h) * 60 + int(m)


def in_killzone(bar):
    mins = bar_minutes(bar)
    for lo, hi in KILLZONES.values():
        if lo <= mins < hi:
            return True
    return False


def is_swing_high(bars, i):
    if i < 2 or i > len(bars) - 3:
        return False
    h = bars[i].high
    return (h > bars[i-1].high and h > bars[i-2].high and
            h > bars[i+1].high and h > bars[i+2].high)


def htf_bearish_at(bars4h, ts):
    prior = [b for b in bars4h if b.date <= ts]
    if len(prior) < 3:
        return False
    a, b, c = prior[-3], prior[-2], prior[-1]
    return c.high < b.high < a.high and c.low < b.low < a.low


def has_bearish_fvg(bars, c):
    if c < 1 or c > len(bars) - 2:
        return False
    return bars[c-1].low > bars[c+1].high


def make_contract():
    c = Contract()
    c.symbol = "MNQ"
    c.secType = "FUT"
    c.exchange = "CME"
    c.currency = "USD"
    c.lastTradeDateOrContractMonth = "20261218"
    return c


def check_signal(app):
    bars = app.bars5
    if len(bars) < 6:
        return None
    i = len(bars) - 3          # aakhri confirm bar
    bar = bars[i]
    if not in_killzone(bar):
        return None
    if not is_swing_high(bars, i):
        return None
    if not htf_bearish_at(app.bars4h, bar.date):
        return None

    ob = None
    for j in range(i, min(i + 5, len(bars) - 2)):
        if bars[j].close > bars[j].open:
            ob = bars[j]
            ob_idx = j
            break
    if ob is None:
        return None
    if not has_bearish_fvg(bars, ob_idx + 1):
        return None

    entry = ob.low
    sl = ob.high
    risk = sl - entry
    if risk <= 0:
        return None
    tp = entry - risk * 3
    return round(entry, 2), round(sl, 2), round(tp, 2)


def place_bracket(app, entry, sl, tp, qty=1):
    c = make_contract()
    parent_id = app.next_id

    parent = Order()
    parent.orderId = parent_id
    parent.action = "SELL"
    parent.orderType = "LMT"
    parent.totalQuantity = qty
    parent.lmtPrice = entry
    parent.transmit = False

    take = Order()
    take.orderId = parent_id + 1
    take.action = "BUY"
    take.orderType = "LMT"
    take.totalQuantity = qty
    take.lmtPrice = tp
    take.parentId = parent_id
    take.transmit = False

    stop = Order()
    stop.orderId = parent_id + 2
    stop.action = "BUY"
    stop.orderType = "STP"
    stop.totalQuantity = qty
    stop.auxPrice = sl
    stop.parentId = parent_id
    stop.transmit = True

    app.placeOrder(parent.orderId, c, parent)
    app.placeOrder(take.orderId, c, take)
    app.placeOrder(stop.orderId, c, stop)
    app.next_id += 3
    print(f"ORDER PLACED: entry {entry}, SL {sl}, TP {tp}")


def main():
    app = LiveBotShort()
    app.connect("127.0.0.1", 7497, clientId=2)

    t = threading.Thread(target=app.run, daemon=True)
    t.start()
    time.sleep(2)

    c = make_contract()
    print("Live bot started on PAPER account. Watching market...")

    while True:
        app.bars5 = []
        app.bars4h = []
        app.done5 = False
        app.done4h = False

        app.reqHistoricalData(1, c, "", "2 D", "5 mins", "TRADES", 1, 1, False, [])
        app.reqHistoricalData(2, c, "", "10 D", "4 hours", "TRADES", 1, 1, False, [])
        time.sleep(15)

        if not app.in_trade:
            sig = check_signal(app)
            if sig:
                entry, sl, tp = sig
                place_bracket(app, entry, sl, tp, qty=1)
                app.in_trade = True
            else:
                print("No valid setup right now.")
        else:
            print("Already in a trade. Waiting...")

        print("Waiting 5 minutes for next check...")
        time.sleep(300)


if __name__ == "__main__":
    main()