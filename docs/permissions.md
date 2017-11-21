### Permissions

| Contract  | Function              | Anyone | Owner | Admin | Registered User (Presale) | Registered User (Crowdsale) |
|-----------|-----------------------|--------|-------|-------|---------------------------|-----------------------------|
| KYC       | register              |        | O     | O     |                           |                             |
|           | unregister            |        | O     | O     |                           |                             |
| Presale   | regiser               |        | O     |       |                           |                             |
|           | unregiser             |        | O     |       |                           |                             |
|           | buyPresale            |        |       |       | O                         |                             |
|           | maxReached            | O      |       |       |                           |                             |
|           | finalizePresale       |        | O     |       |                           |                             |
|           | changeTokenController |        | O     |       |                           |                             |
|           | changeVaultOwner      |        | O     |       |                           |                             |
| Crowdsale | buy                   |        |       |       |                           | O                           |
|           | periodFinished        | O      |       |       |                           |                             |
|           | getRate               | O      |       |       |                           |                             |
|           | minReached            | O      |       |       |                           |                             |
|           | maxReached            | O      |       |       |                           |                             |
|           | startPeriod           |        | O     |       |                           |                             |
|           | finalize              |        | O     |       |                           |                             |
|           | refundAll             |        | O     |       |                           |                             |
|           | claimRefund           |        |       |       |                           | O                           |
