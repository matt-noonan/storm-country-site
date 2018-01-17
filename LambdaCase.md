```haskell
{-# LANGUAGE LambdaCase #-}

data Decision = Yes | No | Meh
  deriving Read

main = readLine >>= \case
  Yes -> putStrLn "ok, sure!"
  No  -> putStrLn "fine, whatever."
  Meh -> main
```