import BorrowButton from '../BorrowButton'
import { PlatformType, PlatformValue } from '../../../types/platform'
import { countCompoundDecimals } from '@/lib/utils'
import WithdrawButton from '../WithdrawButton'
import { TPositionType } from '@/types'
import DepositButton from '../DepositButton'

interface IActionButtonSelectComponent {
    disabled?: boolean
    asset: any
    amount: string
    handleCloseModal: (isVisible: boolean) => void
    actionType: 'lend' | 'borrow' | 'repay' | 'withdraw'
    setActionType?: (actionType: TPositionType) => void
}

const ActionButton = ({
    disabled = false,
    asset,
    amount,
    handleCloseModal,
    actionType,
    setActionType,
}: IActionButtonSelectComponent) => {
    if (actionType === 'withdraw') {
        return (
            <WithdrawButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                asset={asset}
                amount={amount}
            />
        )
    }
    return (
        <>
            <DepositButton
                disabled={disabled}
                handleCloseModal={handleCloseModal}
                poolContractAddress={asset?.core_contract || ''}
                underlyingAssetAdress={asset?.asset?.token?.address || ''}
                amount={amount || ''}
                decimals={asset?.asset?.token?.decimals || 0}
            />
        </>
    )
}

export default ActionButton
