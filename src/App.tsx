import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } =
    usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } =
    useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);

  // if the filter is active that means employee filter need to be called for load more data else simple load more
  const [activeEmployeeId, setactiveEmployeeId] = useState<string>(EMPTY_EMPLOYEE.id); 

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async (clear = false, employeeId = EMPTY_EMPLOYEE.id) => {
    setIsLoading(true);
    if(!!clear) {
      paginatedTransactionsUtils.invalidateData();
    }
    await employeeUtils.fetchAll();
    await paginatedTransactionsUtils.fetchAll({employeeId: employeeId, createNewList: clear});

    setIsLoading(false);
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData();
      transactionsByEmployeeUtils.invalidateData();

      await employeeUtils.fetchAll();
      // await paginatedTransactionsUtils.fetchAll(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  const loadMoreData = async () => {
    console.log(paginatedTransactions?.nextPage)
    if(!paginatedTransactions?.nextPage) return;
    loadAllTransactions(false, activeEmployeeId);
  }

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions(true);
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
              loadAllTransactions(true);
              setactiveEmployeeId(EMPTY_EMPLOYEE.id)
              return;
            }
            setactiveEmployeeId(newValue.id);
            await loadAllTransactions(true, newValue.id);
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={transactions} />

          {/* if no next page present hide the view more button */}
          {transactions !== null && !!paginatedTransactions?.nextPage && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadMoreData();
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
