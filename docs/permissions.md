### Permissions

| Contract  | Function              | Owner | Admin | Registered User |
|-----------|-----------------------|-------|-------|-----------------|
| KYC       | register              | O     | O     |                 |
|           | unregister            | O     | O     |                 |
| Presale   | regiser               | O     |       |                 |
|           | unregiser             | O     |       |                 |
|           | buyPresale            |       |       | O               |
|           | maxReached            | O     | O     | O               |
|           | finalizePresale       | O     |       |                 |
|           | changeTokenController | O     |       |                 |
|           | changeVaultOwner      | O     |       |                 |
| Crowdsale | buy                   |       |       | O               |
|           | periodFinished        | O     | O     | O               |
|           | getRate               | O     | O     | O               |
|           | minReached            | O     | O     | O               |
|           | maxReached            | O     | O     | O               |
|           | startPeriod           | O     |       |                 |
|           | finalize              | O     |       |                 |
|           | refundAll             | O     |       |                 |
|           | claimRefund           |       |       | O               |
