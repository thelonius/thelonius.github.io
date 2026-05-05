=  Eval run: 2026-05-04-baseline → 2026-05-04-feature-rerank-v2
=
=  Query                          precision@1   MRR     Δ
-  family_with_pool                    1.00     1.00
+  family_with_pool                    0.00     0.50    ❌ regression
=  young_professional_modern           1.00     1.00
=  remote_worker_quiet                 1.00     1.00
=  dog_owner_yard                      1.00     0.67
=  elderly_parents_quiet               1.00     1.00
=
+  CI gate: precision@1 dropped on family_with_pool. Blocking merge.
