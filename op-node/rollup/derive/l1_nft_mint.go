package derive

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"math/big"

	"github.com/ethereum-optimism/optimism/op-node/eth"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/crypto"
)

const (
	DeployCharacterSignature = "deployCharacterInstance(address,uint256,uint256)"
	DeployCharacterArguments = 3
	DeployCharacterLen = 4 + 32*DeployCharacterArguments
)

var (
	MintEventABI      = "TokenMinted(address,addres,uint256,uint256)"
	MintEventABIHash  = crypto.Keccak256Hash([]byte(MintEventABI))
	MintEventVersion0 = common.Hash{}
)

var (
	DeployCharacterFuncBytes4 = crypto.Keccak256([]byte(DeployCharacterSignature))[:4]
	DeployCharacterAddress = common.HexToAddress("ENTER_DEPLOYED_ADDRESS")
)

type DeployCharacterInfo struct {
	Owner common.address
	Id uint64
	Traits uint64
}

func (info *DeployCharacterInfo) MarshalBinary() ([]byte, error) {
    data := make([]byte, DeployCharacterLen)
    offset := 0
    copy(data[offset:4], DeployCharacterFuncBytes4)
    offset += 4
    binary.BigEndian.PutUint64(data[offset+24:offset+32], info.Owner)
    offset += 32
    binary.BigEndian.PutUint64(data[offset+24:offset+32], info.Id)
	offset += 32
	binary.BigEndian.PutUint64(data[offset+24:offset+32], info.Traits)
    return data, nil
}

func (info *DeployCharacterInfo) UnmarshalBinary(data []byte) error {
    if len(data) != DeployCharacterLen {
        return fmt.Errorf("data is unexpected length: %d", len(data))
    }
    var padding [24]byte
    offset := 4
	// need to encode address here?
    info.Owner = binary.BigEndian.Uint64(data[offset+24 : offset+32])
    if !bytes.Equal(data[offset:offset+24], padding[:]) {
        return fmt.Errorf("owner address exceeds uint64 bounds: %x", data[offset:offset+32])
    }
    offset += 32
    info.Id = binary.BigEndian.Uint64(data[offset+24 : offset+32])
    if !bytes.Equal(data[offset:offset+24], padding[:]) {
        return fmt.Errorf("character id exceeds uint64 bounds: %x", data[offset:offset+32])
    }
	offset += 32
    info.Traits = binary.BigEndian.Uint64(data[offset+24 : offset+32])
    if !bytes.Equal(data[offset:offset+24], padding[:]) {
        return fmt.Errorf("character traits exceeds uint64 bounds: %x", data[offset:offset+32])
    }	
    return nil
}

func L1MintTxData(data []byte) (DeployCharacterInfo, error) {
    var info DeployCharacterInfo
    err := info.UnmarshalBinary(data)
    return info, err
}
// needs to track events?
func L1Mint(seqNumber uint64, block eth.BlockInfo, sysCfg eth.SystemConfig) (*types.DepositTx, error) {
    infoDat := L1BurnInfo{
        Number: block.NumberU64(),
        Burn:   block.BaseFee().Uint64() * block.GasUsed(),
    }
    data, err := infoDat.MarshalBinary()
    if err != nil {
        return nil, err
    }
    source := L1InfoDepositSource{
        L1BlockHash: block.Hash(),
        SeqNumber:   seqNumber,
    }
    return &types.DepositTx{
        SourceHash:          source.SourceHash(),
        From:                L1InfoDepositerAddress,
        To:                  &L1BurnAddress,
        Mint:                nil,
        Value:               big.NewInt(0),
        Gas:                 150_000_000,
        IsSystemTransaction: true,
        Data:                data,
    }, nil
}

func L1BurnDepositBytes(seqNumber uint64, l1Info eth.BlockInfo, sysCfg eth.SystemConfig) ([]byte, error) {
    dep, err := L1BurnDeposit(seqNumber, l1Info, sysCfg)
    if err != nil {
        return nil, fmt.Errorf("failed to create L1 burn tx: %w", err)
    }
    l1Tx := types.NewTx(dep)
    opaqueL1Tx, err := l1Tx.MarshalBinary()
    if err != nil {
        return nil, fmt.Errorf("failed to encode L1 burn tx: %w", err)
    }
    return opaqueL1Tx, nil
}