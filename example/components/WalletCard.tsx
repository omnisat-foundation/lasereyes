import {
  MAINNET,
  OYL,
  TESTNET,
  UNISAT,
  useLaserEyes,
  XVERSE,
} from '@omnisat/lasereyes'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { createPsbt } from '@/lib/btc'
import useUtxos from '@/hooks/useUtxos'
import { getMempoolSpaceUrl } from '../../src/consts/networks'

const WalletCard = ({
  walletName,
  setSignature,
  setUnsignedPsbt,
  setSignedPsbt,
}: {
  walletName: typeof OYL | typeof UNISAT | typeof XVERSE
  setSignature: (signature: string) => void
  setUnsignedPsbt: (psbt: string) => void
  setSignedPsbt: (
    psbt:
      | string
      | {
          signedPsbtHex: string
          signedPsbtBase64: string
        }
      | undefined
  ) => void
}) => {
  const {
    connect,
    disconnect,
    provider,
    paymentAddress,
    balance,
    hasUnisat,
    hasOyl,
    hasLeather,
    hasXverse,
    sendBTC,
    signMessage,
    signPsbt,
    network,
    switchNetwork,
  } = useLaserEyes()

  const [unsigned, setUnsigned] = useState<string | undefined>()
  const { utxos, loading, fetch } = useUtxos(
    paymentAddress,
    network as typeof MAINNET | typeof TESTNET
  )

  const hasWallet = {
    unisat: hasUnisat,
    oyl: hasOyl,
    leather: hasLeather,
    xverse: hasXverse,
  }

  const connectWallet = async (
    walletName: typeof OYL | typeof UNISAT | typeof XVERSE
  ) => {
    try {
      await connect(walletName)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  useEffect(() => {
    if (utxos.length > 0) {
      const psbt = createPsbt(
        utxos,
        paymentAddress,
        network as typeof MAINNET | typeof TESTNET
      )
      setUnsignedPsbt(psbt.toHex())
      setUnsigned(psbt.toHex())
    }
  }, [utxos])

  const send = async () => {
    try {
      if (balance?.total < 1500) {
        throw new Error('Insufficient funds')
      }

      const txid = await sendBTC(paymentAddress, 1500)
      toast.success(
        <span className={'flex flex-col gap-1 items-center justify-center'}>
          <span className={'font-black'}>View on mempool.space</span>
          <a
            target={'_blank'}
            href={`${getMempoolSpaceUrl(network)}/tx/${txid}`}
            className={'underline text-blue-600 text-xs'}
          >
            {txid}
          </a>
        </span>
      )
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  const sign = async (walletName: string) => {
    setSignature('')
    try {
      const signature = await signMessage(walletName)
      setSignature(signature)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  const signUnsignedPsbt = async () => {
    try {
      if (!unsigned) {
        throw new Error('No unsigned PSBT')
      }
      const signed = await signPsbt(unsigned, true)
      setSignedPsbt(signed)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  const switchNet = async (desiredNetwork: typeof MAINNET | typeof TESTNET) => {
    try {
      await switchNetwork(desiredNetwork)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      }
    }
  }

  return (
    <Card className={'grow bg-[#1d1d1d]'}>
      <CardHeader>
        <CardTitle className={'uppercase text-center text-white'}>
          {walletName}
        </CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <div className={'flex flex-col gap-4'}>
          <div className={'flex flex-row space-between items-center gap-6'}>
            <Badge variant={provider === walletName ? 'success' : 'secondary'}>
              {provider === walletName ? 'Connected' : 'Disconnected'}
            </Badge>

            <Button
              className={'w-full'}
              disabled={!hasWallet[walletName]}
              variant={provider === walletName ? 'ghost' : 'default'}
              onClick={() =>
                provider === walletName
                  ? disconnect()
                  : connectWallet(walletName)
              }
            >
              {provider === walletName ? 'Disconnect' : 'Connect'}
            </Button>
          </div>

          <div className={'flex flex-col space-between items-center gap-2'}>
            <Button
              className={'w-full'}
              disabled={!hasWallet[walletName] || provider !== walletName}
              variant={provider !== walletName ? 'secondary' : 'default'}
              onClick={() => (provider !== walletName ? null : send())}
            >
              Send BTC
            </Button>
            <Button
              className={'w-full'}
              disabled={!hasWallet[walletName] || provider !== walletName}
              variant={provider !== walletName ? 'secondary' : 'default'}
              onClick={() =>
                provider !== walletName
                  ? null
                  : sign(walletName).then(console.log)
              }
            >
              Sign Message
            </Button>
            <Button
              className={'w-full'}
              disabled={
                !hasWallet[walletName] || provider !== walletName || !unsigned
              }
              variant={provider !== walletName ? 'secondary' : 'default'}
              onClick={() =>
                provider !== walletName ? null : signUnsignedPsbt()
              }
            >
              Sign PSBT
            </Button>
            <Button
              className={'w-full'}
              disabled={!hasWallet[walletName] || provider !== walletName}
              variant={provider !== walletName ? 'secondary' : 'default'}
              onClick={() =>
                provider !== walletName
                  ? null
                  : switchNet(network === TESTNET ? MAINNET : TESTNET)
              }
            >
              Switch Network
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter></CardFooter>
    </Card>
  )
}

export default WalletCard
