import { useCallback, useState } from "react"
import { PaginatedRequestMetadata, PaginatedRequestParams, PaginatedResponse, Transaction } from "../utils/types"
import { PaginatedTransactionsResult } from "./types"
import { useCustomFetch } from "./useCustomFetch"

export function usePaginatedTransactions(): PaginatedTransactionsResult {
  const { fetchWithoutCache, loading } = useCustomFetch()
  const [paginatedTransactions, setPaginatedTransactions] = useState<PaginatedResponse<
    Transaction[]
  > | null>(null)

  const fetchAll = useCallback(async (metadata?: PaginatedRequestMetadata) => {
    const requestBody = <PaginatedRequestParams> {
      page: paginatedTransactions === null || (!!metadata && !!metadata.createNewList) ? 0 : paginatedTransactions.nextPage,
    }
    if(metadata && !!metadata.employeeId ) {
      requestBody.employeeId = metadata.employeeId
    }

    const response = await fetchWithoutCache<PaginatedResponse<Transaction[]>, PaginatedRequestParams>(
      "paginatedTransactions",
      requestBody
    )

    setPaginatedTransactions((previousResponse) => {
      if (response === null || previousResponse === null || (metadata && !!metadata.createNewList)) {
        return response
      }
      return { data: [ ...previousResponse.data ,...response.data], nextPage: response.nextPage }
    })
  }, [fetchWithoutCache, paginatedTransactions])

  const invalidateData = useCallback( () => {
    setPaginatedTransactions(null)
  }, [])

  return { data: paginatedTransactions, loading, fetchAll, invalidateData }
}
