import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { QUERY_RSA_CONFIG, RSAConfig } from "../queries/ras_config";
import { QueryRSAConfig } from "../queries/__generated__/QueryRSAConfig";

export const useRasConfig = () => {
  const qConfig = useQuery<QueryRSAConfig>(QUERY_RSA_CONFIG);

  const rsaConfig = useMemo(() => {
    const pid = qConfig?.data?.RentAScientistConfig_by_pk?.program_id || -1;
    const lstart =
      qConfig?.data?.RentAScientistConfig_by_pk?.Program.lectureStart;
    const lend = qConfig?.data?.RentAScientistConfig_by_pk?.Program.lectureEnd;
    const result: RSAConfig = {
      programId: pid,
      start: lstart || new Date(),
      end: lend || new Date(),
      visibility:
        qConfig?.data?.RentAScientistConfig_by_pk?.Program.visibility || false,
      test_operation:
        qConfig?.data?.RentAScientistConfig_by_pk?.test_operation !== false,
      fromMail: qConfig.data?.RentAScientistConfig_by_pk?.mailFrom || undefined,
    };
    console.log("rsa config", result);
    return result;
  }, [qConfig]);

  return rsaConfig;
};
