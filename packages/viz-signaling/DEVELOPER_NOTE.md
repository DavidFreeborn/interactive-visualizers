# Developer Note

## Derived Directly From the Mathematical Spec

- one sender, one receiver, one message per round
- proportional sampling from actual weight rows
- success-only reinforcement on exactly one sender cell and one receiver cell
- policy extraction by row-normalization
- exact expected success formula
- exact mutual information `I(S; M)` from the sender channel and state prior
- maximum mutual information `log2(min(numStates, numMessages))`
- optional stable-signaling badge only under the explicit greedy/expected-success conditions

## Validated Analytically

- uniform `2x2` expected success is `0.5`
- perfect `2x2` expected success is `1.0`
- perfect `4x4` expected success is `1.0`
- uniform `2x2` sender channel has `0` bits of mutual information
- perfect `2x2` sender channel has `1` bit
- perfect `4x4` sender channel has `2` bits
- partially informative `2x2` test channel matches the hand-computed value `0.311278124459` bits

## Validated Empirically

Calibration file:

- [`calibration/baseline-2x2-calibration.json`](./calibration/baseline-2x2-calibration.json)

Sweep:

- `200` honest seeds
- `5000` rounds each
- default `2x2x2` baseline configuration

Observed summary:

- median final expected success: `0.9979785556565042`
- lower quartile final expected success: `0.9932826384714094`
- median final mutual information: `0.9885132482953882`
- lower quartile final mutual information: `0.9677814736664662`
- median final cumulative success: `0.9865`

Conservative stochastic regression floors derived from the calibration summary:

- expected success median floor: `0.973`
- mutual information median floor: `0.937`

## Verification Status

Automated verification completed:

- unit tests
- integration tests
- jsdom UI tests
- stochastic regression tests
- typecheck
- workspace lint
- showcase production build

Manual browser inspection was not performed inside this terminal session, so fine-grained visual checks like edge aesthetics at every size and animation feel at every speed should still be reviewed in the browser before treating the package as visually final.
